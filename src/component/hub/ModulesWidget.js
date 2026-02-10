
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Divider, Heading, Image, Text} from "native-base";
import images from "../../utils/images";


const ModulesWidget = ({modules, sensor}) => {

    const rows = [];
    for (let i = 0; i < modules.length; i += 2) {
        const rowData = modules.slice(i, i + 2);
        const row = (
            <View style={styles.row} key={i}>
                {rowData.map((item, index) => (
                    <TouchableOpacity style={styles.card} key={index} onPress={() => {console.log('klik')}}>
                        <Image source={item.icon} alt={item.name} size={'sm'} alignItems={'center'} />
                        <View style={styles.data}>
                            <Heading fontSize="sm">{item.name}</Heading>
                            <Text fontSize="2xs" color={item.status ? 'green.600' : 'red.600'}>{item.status ? 'Włączone' : 'Wyłączone'}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
        rows.push(row);
    }

    return (
        <View style={styles.container}>
            <Heading fontSize="md">Temperatura i wilgotność</Heading>

            <View style={styles.tah}>
                <Image source={images.temperature} alt={'temperature'} size={'sm'} />
                <View style={styles.tahData}>
                    <Text fontSize={'3xl'} fontWeight={'bold'}>{sensor.temperature}°C</Text>
                    <Divider orientation={'vertical'} height={7} mx={3}/>
                    <Text fontSize={'3xl'} fontWeight={'light'}>{sensor.humidity}%</Text>
                </View>
            </View>

            <Heading fontSize="md" marginBottom={2}>Moduły</Heading>
            {rows}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
    },
    data: {
        flexDirection: 'column',
        width: '100%',
        marginTop: 18,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 18,
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    tah: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 15,
        marginHorizontal: 5
    },
    tahData: {
        flexDirection: 'row',
        alignItems: 'center',
    },
})

export default ModulesWidget;