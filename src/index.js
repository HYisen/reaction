/*
 * Copyright (C) 2019 Alex <alexhyisen@gmail.com>
 *
 * This file is part of reaction.
 *
 * reaction is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * reaction is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with reaction.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import App from "./App";


ReactDOM.render(
    <App width={400} height={200} showGrid={true} rankCount={5} itemCount={8} statUnit={1}
         timestamp={new Date(0)} status={false}/>
                     , document.getElementById('root'));


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
