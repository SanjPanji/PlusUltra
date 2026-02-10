import {Text} from "native-base";
import {Alert, StyleSheet, TouchableOpacity, View} from "react-native";
import {useEffect, useState} from "react";
import IconBack from "../../assets/icon/IconBack";
import {BarCodeScanner} from "expo-barcode-scanner";
import images from "../utils/images";

const isJSON = (variable) => {
  try {
    JSON.parse(variable);
    return true;
  } catch (error) {
    return false;
  }
};

const newHub = {
    name: 'QR CODE HUB',
    sensors: {
        temperature: 19,
        humidity: 11
    },
    modules: [
        {
            name: 'Świeże powietrze',
            icon: images.fan,
            status: false
        },
        {
            name: 'Brudne powietrze',
            icon: images.fan,
            status: false
        },
        {
            name: 'Światło',
            icon: images.light,
            status: false
        },
        {
            name: 'Nawożenie',
            icon: images.tube,
            status: true
        }
    ]
}

const CameraScreen = ({navigation}) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center' }}>Requesting for camera permission</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center' }}>Requesting for camera permission</Text>
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }) => {
        if (!scanned) {
            setScanned(true);
            if (isJSON(data)) {
                navigation.navigate({
                    name: 'Home',
                    params: {newHub: newHub},
                    merge: true,
                  });
            } else {
                Alert.alert('Błąd', 'Błędny kod QR', [
                  {text: 'OK', onPress: () => setScanned(false)},
                ]);

            }
        }
    };

    return (
        <View style={styles.container}>

            <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={StyleSheet.absoluteFillObject}/>

            <View style={styles.header}>
              <TouchableOpacity style={styles.back} onPress={() => {navigation.navigate({
                name: 'Home',
                params: {newHub: null},
                merge: true,
              });}}>
                <IconBack color={'black'} />
              </TouchableOpacity>
            </View>
        </View>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 50,
        paddingHorizontal: 10,
    },
    back: {
        padding: 10,
        margin: 10,
        backgroundColor: 'white',
        borderRadius: 25,
        shadowRadius: 10,
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 0 },
        elevation: 5,
    }
});
export default CameraScreen;