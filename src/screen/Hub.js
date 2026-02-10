import {ScrollView} from "native-base";
import {SafeAreaView} from "react-native-safe-area-context";
import {StyleSheet} from "react-native";
import ModulesWidget from "../component/hub/ModulesWidget";
import BackHeader from "../component/header/Back";

const HubScreen = ({navigation, route}) => {

    const {hub} = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <BackHeader navigation={navigation} title={hub.name}/>
            <ScrollView>
                <ModulesWidget modules={hub.modules} sensor={hub.sensors} />
            </ScrollView>
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

export default HubScreen;