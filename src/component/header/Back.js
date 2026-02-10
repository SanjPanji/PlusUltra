import {StyleSheet, TouchableOpacity, View} from "react-native";
import {Heading, Image, Text} from "native-base";
import images from "../../utils/images";
import IconBack from "../../../assets/icon/IconBack";


const BackHeader = ({navigation, title}) => {
    return (
        <View style={styles.container}>

            <TouchableOpacity onPress={() => {navigation.goBack()}}>
                <IconBack color={'#000'} />
            </TouchableOpacity>

            <View style={styles.text}>
                <Heading size={'lg'}>{title}</Heading>
                <Text fontSize={'xs'}>Zarządzaj namiotem</Text>
            </View>
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
        alignItems: 'flex-end',
    }

});

export default BackHeader;