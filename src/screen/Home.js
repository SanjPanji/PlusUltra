import {Actionsheet, Box, Text, Fab, Heading, Icon, useDisclose, ScrollView} from "native-base";
import {SafeAreaView} from "react-native-safe-area-context";
import {StyleSheet} from "react-native";
import images from "../utils/images";
import HomeHeader from "../component/header/Home";
import HubListItem from "../component/home/HubListItem";
import {useState} from "react";
import {AntDesign} from "@expo/vector-icons";


const data = [
    {
        name: 'Hub 1',
        sensors: {
            temperature: 34,
            humidity: 23
        },
        modules: [
            {
                name: 'Świeże powietrze',
                icon: images.fan,
                status: true
            },
            {
                name: 'Brudne powietrze',
                icon: images.fan,
                status: false
            },
            {
                name: 'Światło',
                icon: images.light,
                status: true
            },
            {
                name: 'Nawożenie',
                icon: images.tube,
                status: true
            }
        ]
    },
    {
        name: 'Hub 2',
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
]

const HomeScreen = ({navigation, route}) => {

    const [hubs, setHubs] = useState(data)
    const [addHub, setAddHub] = useState(false)
    const {newHub} = route.params;

    if (newHub && !addHub) {
        setAddHub(true)
        setHubs([...hubs, newHub])
    }


    return (
        <SafeAreaView style={styles.container}>
            <HomeHeader navigation={navigation} />
            <Heading fontSize="md" mb={2}>Dostępne huby</Heading>

            <ScrollView>
                {hubs.map((hub, index) => <HubListItem key={index} hub={hub} navigation={navigation} />)}
            </ScrollView>
            <Fab renderInPortal={false} shadow={2} placement="bottom-right" size="sm" icon={<Icon color="white" as={AntDesign} name="plus" size="4" />} label="Dodaj" onPress={() => {navigation.navigate('Camera')}} />

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
   container: {
       paddingHorizontal: 20,
       backgroundColor: '#F4F6FA',
       height: '100%'
   }
});

export default HomeScreen;