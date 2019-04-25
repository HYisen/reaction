import React, {Component} from 'react'
import './App.css'
import {Clock} from "./clock";
import {Chart} from "./Chart";
import {LoginControl} from "./login";
import Main from "./Main";

class App extends Component {
    render() {
        return (
            <div>
                <Main/>
                {/*<Clock/>*/}
                {/*<Chart width={400} height={200} showGrid={false} rankCount={5} itemCount={8} statUnit={1}*/}
                       {/*lastRx={new Date(0)} status={false}/>*/}
                {/*<LoginControl/>*/}
            </div>
        );
    }
}

export default App
