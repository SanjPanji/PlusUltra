import createDataContext from "./createDataContext";


const user = {
    token: 'abc123',
    username: 'testuser',
    firstName: 'Test',
}

const authReducer = (state, action) => {
    switch (action.type) {
        case 'login':
            return {
                token: action.payload.token,
                username: action.payload.username,
                firstName: action.payload.firstName,
            }
        case 'logout':
            return null;
        default:
            return state;
    }
}

const login = (dispatch) => {

    return({username, password}) => {
        console.log('User' + username + 'logged in');

        dispatch({
            type: 'login',
            payload: {
                token: 'abc123',
                username: 'test',
                firstName: 'TEST',
            },
        });
    }

}

const logout = dispatch => {
    return () => {
        dispatch({type: 'logout'});
    };
};

export const {Provider, Context} = createDataContext(
  authReducer,
  {login, logout},
  {token: null, username: '', firstName: ''},
);