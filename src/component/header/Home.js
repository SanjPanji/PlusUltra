import {StyleSheet, TouchableOpacity, View} from "react-native";
import {Heading, Text} from "native-base";
import IconLogout from "../../../assets/icon/IconLogout";


const HomeHeader = ({navigation}) => {
    return (
        <View style={styles.container}>
            <View style={styles.text}>
                <Heading size={'lg'}>Witaj, Oliwer</Heading>
                <Text fontSize={'xs'}>Zarządzaj namiotem</Text>
            </View>

            <TouchableOpacity onPress={() => {navigation.navigate('Login')}}>
                <IconLogout color={'#000'} />
            </TouchableOpacity>
        </View>
    )
}


const styles = StyleSheet.create({

    container: {
        marginVertical: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    image:{
        width: 25,
        height: 25,
    },
    text: {
        alignItems: 'flex-start',
    }

});

export default HomeHeader;