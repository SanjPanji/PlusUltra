import images from "../utils/images";
import {Center, Image} from "native-base";
const SplashScreen = () => {

    return (
        <Center w="100%" height={'100%'} backgroundColor={'#F4F6FA'}>
            <Image size={'md'} source={images.logoGif2} alt={'logo'}/>
        </Center>
    )

}

export default SplashScreen;