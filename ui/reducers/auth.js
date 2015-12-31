import _ from 'lodash';
import { Actions } from '../constants';

const initialState = {
  isLoggedIn: false,
  name: null,
  email: null,
  redirectTo: null,
  showRecoverPasswordForm: false,
  isLoaded: true
};

export default function(state=initialState, action) {
  switch(action.type) {

    case Actions.LOGIN_REQUIRED:
      return Object.assign({}, state, { redirectTo: action.payload });

    case Actions.LOGIN_SUCCESS:
    case Actions.SIGNUP_SUCCESS:
      return Object.assign({}, state, action.payload, { isLoggedIn: true });

    case Actions.LOGIN_FAILURE:
    case Actions.SIGNUP_FAILURE:
      return Object.assign({}, state, { name: null, email: null, isLoggedIn: false });

    case Actions.CURRENT_USER:
      return Object.assign({}, state, action.payload, { isLoggedIn: !_.isEmpty(action.payload) });

    case Actions.CHANGE_EMAIL_SUCCESS:
      return Object.assign({}, state, { email: action.payload });

    case Actions.OPEN_RECOVER_PASSWORD_FORM:
    case Actions.CLOSE_RECOVER_PASSWORD_FORM:
      return Object.assign({}, state, { showRecoverPasswordForm: action.type === Actions.OPEN_RECOVER_PASSWORD_FORM });

    case Actions.DELETE_ACCOUNT_SUCCESS:
    case Actions.LOGOUT:
      return initialState;
  }
  return state;
}
