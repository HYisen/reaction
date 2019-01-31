import React from "react";
import Button from '@material-ui/core/Button';

function LoginButton(props) {
    return (
        <button onClick={props.onclick}>Login</button>
    );
}

function LogoutButton(props) {
    return (
        <Button onClick={props.onclick} variant="contained" color="primary">
            Logout
        </Button>
    );
}

export class LoginControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hasLogined: false};
        this.handleLogin = this.handleLogin.bind(this);
    }

    handleLogin() {
        this.setState({hasLogined: true});
    }

    handleLogout = () => {
        this.setState({hasLogined: false});
    };

    render() {
        let button;
        if (!this.state.hasLogined) {
            button = <LoginButton onclick={this.handleLogin}/>;
        } else {
            button = <LogoutButton onclick={this.handleLogout}/>;
        }
        // console.log('render login');
        return (
            <div>
                {button}
            </div>
        );
    }
}