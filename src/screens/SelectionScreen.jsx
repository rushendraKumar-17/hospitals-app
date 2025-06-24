import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AppContext from '../context/AppContext';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const HealthInsurerTPAScreen = () => {
  const [insurers, setInsurers] = useState([]);
  const navigation = useNavigation();
  const [selectedInsurer, setSelectedInsurer] = useState('');
  const [tpas, setTPAs] = useState([]);
  const [selectedTPA, setSelectedTPA] = useState('');
  const [loadingInsurers, setLoadingInsurers] = useState(true);
  const [loadingTPAs, setLoadingTPAs] = useState(false);
  const { userLocation, setUserLocation, apiUrl } = useContext(AppContext);
  console.log(apiUrl)
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return result === RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        console.log('Latitude:', latitude);
        console.log('Longitude:', longitude);
      },
      error => {
        console.warn('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
      },
    );
  };

  const handleShowMap = () => {
    navigation.navigate('Map', { insurer: selectedInsurer, tpa: selectedTPA });
  };

  useEffect(() => {
    setLoadingInsurers(true);
    axios
      .get(`${apiUrl}/health-insurer`)
      .then(({ data }) => {
        console.log(data);
        setInsurers(data)})
      .catch(() => setInsurers([]))
      .finally(() => setLoadingInsurers(false));
  }, []);

  useEffect(() => {
    getLocation();
  }, []);

  // Fetch TPAs when insurer changes
  useEffect(() => {
    if (!selectedInsurer) {
      setTPAs([]);
      setSelectedTPA('');
      return;
    }
    setLoadingTPAs(true);
    axios
      .post(`${apiUrl}/get-tpa`, { id: selectedInsurer })
      .then(res => setTPAs(res.data.TPAs))
      .catch(() => setTPAs([]))
      .finally(() => setLoadingTPAs(false));
  }, [selectedInsurer]);

  const canShowMap = selectedInsurer && selectedTPA;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.header}>Find Network Hospitals</Text>
        <Text style={styles.label}>Select Health Insurer</Text>
        {loadingInsurers ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={styles.loader}
          />
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedInsurer}
              onValueChange={value => setSelectedInsurer(value)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#007AFF"
            >
              <Picker.Item label="Choose insurer..." value="" />
              {insurers.map(ins => (
                <Picker.Item key={ins._id} label={ins.Insurer} value={ins.no} />
              ))}
            </Picker>
          </View>
        )}

        {selectedInsurer ? (
          <>
            <Text style={[styles.label, { marginTop: 20 }]}>Select TPA</Text>
            {loadingTPAs ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={styles.loader}
              />
            ) : (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedTPA}
                  onValueChange={value => setSelectedTPA(value)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  enabled={!!selectedInsurer}
                  dropdownIconColor="#007AFF"
                >
                  <Picker.Item label="Choose TPA..." value="" />
                  {tpas.map(tpa => (
                    <Picker.Item key={tpa.id} label={tpa.name} value={tpa.no} />
                  ))}
                </Picker>
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            canShowMap ? styles.buttonEnabled : styles.buttonDisabled,
          ]}
          onPress={handleShowMap}
          disabled={!canShowMap}
          activeOpacity={canShowMap ? 0.7 : 1}
        >
          <Text style={[styles.buttonText, !canShowMap && { color: '#aaa' }]}>
            Show on Map
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
    width: '100%',
    color: '#1C1C1E',
  },
  pickerItem: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1C1C1E',
  },
  loader: {
    marginVertical: 16,
  },
  button: {
    marginTop: 32,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#D1D1D6',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default HealthInsurerTPAScreen;
