import React, {Component} from 'react'
import './App.css'
import {Clock} from "./clock";
import {Chart} from "./chart";
import {LoginControl} from "./login";

class App extends Component {
    render() {
        return (
            <div>
                <Clock/>
                <Chart width={400} height={200} showGrid={true} rankCount={5} itemCount={8} statUnit={1}/>
                <LoginControl/>
            </div>
        );
    }
}

export default App
