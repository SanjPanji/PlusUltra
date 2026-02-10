import {Box, Button, Center, FormControl, Heading, Input, VStack} from "native-base";
import {useState} from "react";
import SplashScreen from "../Splash";

const delay = ms => new Promise(
  resolve => setTimeout(resolve, ms)
);

const LoginScreen = ({navigation}) => {

    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');


    const doLogin = async event => {

        if (username === '' || password === ''){
            alert('Wypełnij wszystkie pola!');
            return;
        }

        setLoading(true);
        await delay(2000);

        try {
            const response = await fetch('https://run.mocky.io/v3/ef98a474-fe71-4356-b6ea-ccc35b145152');
            const data = await response.json();
            if (data.username !== username || data.password !== password){
                alert('Niepoprawne dane logowania!');
            } else {
                navigation.navigate('Home');
            }
        } catch (error) {
            alert(error);
        } finally {
            await delay( 500);
            setLoading(false);
        }
      };

    if (loading) return (<SplashScreen/>)

    return (
        <Center w="100%" height={'100%'} backgroundColor={'#F4F6FA'}>
          <Box safeArea p="2" py="8" w="90%" maxW="290">
            <Heading size="lg" fontWeight="600" color="coolGray.800" _dark={{
            color: "warmGray.50"
          }}>
              Witaj!
            </Heading>
            <Heading mt="1" _dark={{
            color: "warmGray.200"
          }} color="coolGray.600" fontWeight="medium" size="xs">
              Zaloguj się, aby kontynuować.
            </Heading>

            <VStack space={3} mt="5">
              <FormControl>
                <FormControl.Label>Nazwa użytkownika</FormControl.Label>
                <Input onChangeText={setUsername} value={username}/>
              </FormControl>
              <FormControl>
                <FormControl.Label>Hasło</FormControl.Label>
                <Input type="password" onChangeText={setPassword} value={password} />
              </FormControl>
              <Button mt="2" colorScheme="indigo" onPress={doLogin}>Zaloguj</Button>
            </VStack>
          </Box>
        </Center>
    )
}

export default LoginScreen;