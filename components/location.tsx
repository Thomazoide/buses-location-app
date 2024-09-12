import { useState, useEffect } from "react";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { Alert, Button, StyleSheet, TextInput } from "react-native";
import * as Location from 'expo-location';
import { isTaskRegisteredAsync } from 'expo-task-manager';
import { GEOLOCALIZACION } from "@/constants/taskNames";
import axios from "axios";
import { CHECK_BEACON_MAC_ENDPOINT } from "@/constants/endpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";

const styles = StyleSheet.create({
    textInput: {
        margin: 5,
        padding: 10,
        borderStyle: "solid",
        borderWidth: 5,
        borderRadius: 50,
        borderColor: "gray",
    },
    littleButton: {
        backgroundColor: "red",
        borderRadius: 50
    },
    errorMessage: {
        fontSize: 10,
        color: "red"
    }
})

export default function UserLocation() {
    const [locationStarted, setLocationStarted] = useState<boolean>(false)
    const [permisoUbicacion, setPermisoUbicacion] = useState<boolean>(false)
    const [rut, setRut] = useState<string>()
    const [isMacValid, setIsMacValid] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>()

    const options: Location.LocationTaskOptions = {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0,
        deferredUpdatesInterval: 5000,
        deferredUpdatesDistance: 0,
	showsBackgroundLocationIndicator: true,
        foregroundService: {
            notificationTitle: "Compartiendo ubicación",
            notificationBody: "Se está compartiendo la ubicación en tiempo real"
        },
	pausesUpdatesAutomatically: false
    }

    const startLocationAlt = () => {
        Location.startLocationUpdatesAsync(GEOLOCALIZACION, options)
            .then( () => {
                Location.hasStartedLocationUpdatesAsync(GEOLOCALIZACION).then( (estaCompartiendo: boolean) => {
                    if(estaCompartiendo){
                        console.log("Compartiendo ubicación...")
                        setLocationStarted(estaCompartiendo)
                    } else {
                        console.log("No se esta compartiendo la ubicación")
                        Alert.alert('Error al compartir ubicación...')
                    }
                } )
            } ).catch( (err) => console.log(err) )
    }

    const configBackground = async () => {
        let resb = await Location.requestBackgroundPermissionsAsync()
        if(resb.status != 'granted'){
            Alert.alert('Permiso de segundo plano denegado')
        } else {
            setPermisoUbicacion(true)
            Alert.alert('Permiso en segundo plano concedido!')
        }
    }
    const configForeground = async () => {
        let resf = await Location.requestForegroundPermissionsAsync()
        if(resf.status != 'granted'){
            Alert.alert('Permiso denegado a la aplicación')
        } else {
            await configBackground()
        }
    }

    const stopLocation = () => {
        setLocationStarted(false)
        isTaskRegisteredAsync(GEOLOCALIZACION)
            .then( (tracking: boolean) => {
                if(tracking){
                    Location.stopLocationUpdatesAsync(GEOLOCALIZACION)
                    console.log("Escondiendo...")
                }
            } )
    }

    const requestPermission = async () => {
        const rutValue = await AsyncStorage.getItem('rut')
        rutValue ? setRut(rutValue) : null
        const rutValidity: boolean = rutValue ? (await axios.put(CHECK_BEACON_MAC_ENDPOINT, {rut: rutValue})).data : false
        setIsMacValid(rutValidity)
        if(!locationStarted && rutValidity){
            const locationPermissions = await Location.requestForegroundPermissionsAsync()
                    if(locationPermissions.granted){
                        setPermisoUbicacion(true)
                        startLocationAlt()
                    }
        }
    }

    const verificarRut = async () => {
        setErrorMessage(undefined)
        console.log(rut)
        if(rut){
            await AsyncStorage.setItem('rut', rut)
            const body = {
                rut: rut.toLowerCase()
            }
            const response: boolean = (await axios.put(CHECK_BEACON_MAC_ENDPOINT, body)).data
            console.log(response)
            if(!response){
                setErrorMessage('RUT NO EXISTENTE...')
                return
            }
            setErrorMessage(undefined)
            setIsMacValid(response)
            startLocationAlt()
        } else {
            setErrorMessage('Se debe rellenar el campo y verificar para continuar...')
        }
    }

    useEffect( () => {
        requestPermission()
    }, [] )

    return(
        <ThemedView>
            { !locationStarted ?
            <>
            <ThemedText>
                Para usar la app solo debes conceder los permisos necesarios, cuando sedas los permisos de ubicación debes marcar específicamente la opción "Compartir siempre".
            </ThemedText>
            { !permisoUbicacion &&
                <Button title="Conceder permisos" onPress={configForeground} />
            }
            
            { permisoUbicacion && 
                <>
                <TextInput placeholder="Ingrese el rut del chofer" value={rut} onChangeText={setRut} style={styles.textInput}/>
                {
                    errorMessage &&
                        <ThemedText style={styles.errorMessage} >
                            {errorMessage}
                        </ThemedText>
                }
                <Button title="Verificar" color={"red"} onPress={verificarRut} />
                </>
            }
            </>
            : locationStarted && isMacValid ? <>
            <ThemedText>
                Compartiendo la ubicación
            </ThemedText>
            </> : null }
        </ThemedView>
    )
}


