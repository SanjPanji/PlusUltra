
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Divider, Heading, Image, Text} from "native-base";
import images from "../../utils/images";


const HubListItem = ({navigation, hub}) => {

    return (
        <TouchableOpacity style={styles.card} onPress={() => { navigation.navigate('Hub', {hub: hub})} }>
            <Image source={images.hub} alt={hub.name} size={'sm'} alignItems={'center'} />
            <Heading fontSize="md" ml={3}>{hub.name}</Heading>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 5,
        marginVertical: 5,
    },
})

export default HubListItem;