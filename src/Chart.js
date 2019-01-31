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

import React from "react";
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {LabeledSlider} from "./slider";

export class Chart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            height: props.height,
            showGrid: props.showGrid,
            rankCount: props.rankCount,
            itemCount: props.itemCount,
            statUnit: props.statUnit,
            lastRx: props.lastRx,
            status: props.status
        };
    }

    update = () => {
        // console.log('update');
        const url = 'http://ol.tinylink.cn/onelink/project_module/project_control.php?type=rawData&dataSource=2206';
        fetch(url)
            .then(response => response.json())
            .then(json => json['data'][2206])
            .then(cnt => {
                const lumiThreshold = 100;

                const lumi = parseInt(cnt['value']);
                const time = new Date(cnt['time']);

                // console.log(lumi);
                // console.log(time);
                if (time.valueOf() > this.state.lastRx.valueOf()) {
                    const status = lumi > lumiThreshold;
                    // this.manage(status, time);
                    this.setState({lastRx: time, status: status});
                }
            });
    };

    manage = (newStatus, newTime) => {
        const minute = newTime.getMinutes();
        const second = newTime.getSeconds();
        let elapse = (newTime - this.oldTime);

        // console.log(`elapsed ${elapse} ms`);

        const shouldUpdateMinutely = minute !== this.oldTime.getMinutes();
        const shouldUpdateHourly = newTime.getHours() !== this.oldTime.getHours();
        this.oldTime = newTime;

        if (shouldUpdateHourly) {
            console.log(`hourly update at ${newTime.toString()}`);
            this.statData = new Array(60);
            this.statData.fill(new Array(60));
        }
        if (shouldUpdateMinutely) {
            console.log(`minutely update at ${newTime.toString()}`);
            console.log(`on for ${this.onMsCount} ms (${this.usage[0]}) switch ${this.count[0]} times`);

            this.usage.unshift(0.0);
            this.count.unshift(0);

            this.onMsCount = 0;
            elapse = 0;
        }

        if (this.state.status === true) {
            this.onMsCount += elapse;
            // console.log(`${this.onMsCount / (second * 1000)}=${this.onMsCount}/${second}000`);
            if (second >= 1) {
                this.usage[0] = this.onMsCount / (second * 1000);
            }
        }

        if (newStatus !== this.loggedStatus) {
            this.loggedStatus = newStatus;
            this.count[0] += 1;
        }
    };

    componentDidMount() {
        this.timerID0 = setInterval(() => this.update(), 2000);
        this.timerID1 = setInterval(() => this.manage(this.state.status, new Date()), 2000);

        this.oldTime = new Date(0);

        this.usage = [0.0];
        this.count = [0];

        let canvas = document.getElementById("canvas");
        this.ctx = canvas.getContext('2d');
        this.paint(this.ctx);
    }

    componentWillUnmount() {
        clearInterval(this.timerID0);
        clearInterval(this.timerID1);
    }

    paint = (ctx) => {
        ctx.clearRect(0, 0, this.state.width, this.state.height);

        const draw = (x, y, ...moves) => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            let cnt = moves.length / 2;
            for (let i = 0; i < cnt; i++) {
                x += moves[2 * i];
                y += moves[2 * i + 1];
                ctx.lineTo(x, y);
            }
        };

        const line = (x0, y0, x1, y1, style = null) => {
            if (!style) {
                ctx.strokeStyle = style;
            }
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        };

        const grid = (step = 10, width = this.state.width, height = this.state.height) => {
            for (let i = 0; i <= width; i += step) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            for (let j = 0; j <= height; j += step) {
                ctx.beginPath();
                ctx.moveTo(0, j);
                ctx.lineTo(width, j);
                ctx.stroke();
            }
        };

        const tick = (x, y, dx, dy, msg) => {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillText(msg, x + dx, y + dy);
        };

        //reset pen config to normal
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.font = '12px serif';
        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';

        const west = 30;
        const east = this.state.width - 30;
        const north = 20;
        const south = this.state.height - 30;


        //draw grid
        if (this.state.showGrid) {
            grid();
            grid(50);
        }

        ctx.fillStyle = 'red';

        // console.log(this.usage);
        // console.log(this.count);
        let usage = this.usage;
        // let usage = [0.2, 0.1, 0.5, 0.6, 0.8, 0.9, 1.0, 0.4];
        let count = this.count;
        // let count = [10, 6, 5, 20, 4, 2, 0, 14];

        const rankCount = this.state.rankCount;
        const rankHeight = (south - north) / rankCount;

        //calculate a proper metric of count value
        let metric = 4;
        const maxValue = Math.max(...count);
        while (rankCount * metric < maxValue) {
            metric *= 2;
        }
        while (rankCount * metric / 2 > maxValue) {
            metric /= 2;
        }
        // console.log(`metric=${metric}`);

        const ratioTick = 100 / rankCount;
        const valueTick = metric;
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(50,50,50,0.9)';
        for (let k = 0; k <= rankCount; k++) {
            const y = south - rankHeight * k;
            line(west, y, east, y);
            ctx.fillStyle = 'rgba(200,0,0,0.8)';
            tick(west, y, -15, 0, `${Math.floor(ratioTick * k)}%`);
            ctx.fillStyle = 'rgba(0,0,200,0.8)';
            tick(east, y, 15, 0, `${valueTick * k}`);
        }


        const sideMargin = 10;
        const itemCount = this.state.itemCount;
        const itemWidth = ((east - west) - sideMargin * 2) / itemCount;
        const omegaLeft = east - sideMargin - itemWidth;
        const ratioHeight = (south - north);
        //TODO: cache the result of calTime
        const calTime = k => {
            const lastTime = new Date(this.oldTime - 60000 * k).toTimeString();
            if (itemCount > 10) {
                return lastTime.substr(3, 2);
            } else {
                return lastTime.substr(0, 2) + lastTime.substr(3, 2);
            }
        };
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        for (let k = 0; k < itemCount; k++) {
            ctx.fillStyle = 'rgba(100,0,0,0.8)';
            const x = omegaLeft - itemWidth * k;
            ctx.fillRect(x, south - ratioHeight * usage[k], itemWidth, ratioHeight * usage[k]);
            ctx.strokeRect(x, south - ratioHeight * usage[k], itemWidth, ratioHeight * usage[k]);
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            tick(x + itemWidth / 2, south, 0, 10, calTime(k));
        }

        const valueHeight = rankHeight / metric;
        ctx.strokeStyle = 'rgba(0,0,200,0.9)';
        ctx.beginPath();
        for (let k = 0; k < itemCount; k++) {
            const x = omegaLeft - itemWidth * k + itemWidth / 2;
            const y = south - count[k] * valueHeight;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,200,0.9)';
        for (let k = 0; k < itemCount; k++) {
            const x = omegaLeft - itemWidth * k + itemWidth / 2;
            const y = south - count[k] * valueHeight;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        draw(west, north, 0, south - north, east - west, 0, 0, north - south);
        ctx.stroke();
        // line(west, north, west, south);
        // line(east, north, east, south);
        // line(west, south, east, south);
    };


    render() {
        // console.log(`render with grid ${this.state.showGrid}`);
        if (this.ctx) {
            this.paint(this.ctx);
        }
        return (
            <div>
                <p>last_rx = {this.state.lastRx.toISOString()} &nbsp;&nbsp;&nbsp;&nbsp;
                    status = {this.state.status ? 'ON' : 'OFF'}</p>
                <canvas id="canvas" width={this.state.width} height={this.state.height}>
                    <p>This is a Chart should have displayed through &lt;canvas&gt;.</p>
                </canvas>
                <br/>

                <div className={'config'}>
                    <FormControl>
                        <InputLabel htmlFor="statUnitSelect">statUnit</InputLabel>
                        <Select
                            value={this.state.statUnit}
                            onChange={event => {
                                console.log(`change rankCount to ${event.target.value}`);
                                this.setState({statUnit: event.target.value});
                            }}
                            inputProps={{
                                name: 'statUnit',
                                id: 'statUnitSelect',
                            }}
                        >
                            <MenuItem value={1}>1 min</MenuItem>
                            <MenuItem value={5}>5 min</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel className={'switch'}
                                      control={
                                          <Switch
                                              checked={this.state.showGrid}
                                              onChange={(event, checked) => {
                                                  console.log(`change showGrid to ${checked}`);
                                                  this.setState({showGrid: checked})
                                              }}
                                              value="showGrid"
                                              color="primary"
                                          />
                                      }
                                      label="showGrid"
                    />
                </div>
                <div className={'slider'}>
                    <FormControl>
                        <InputLabel htmlFor="rankCountSelect">rankCount</InputLabel>
                        <Select
                            value={this.state.rankCount}
                            onChange={event => {
                                console.log(`change rankCount to ${event.target.value}`);
                                this.setState({rankCount: event.target.value});
                            }}
                            inputProps={{
                                name: 'itemCount',
                                id: 'itemCountSelect',
                            }}
                        >
                            <MenuItem value={3}>3 ranks</MenuItem>
                            <MenuItem value={4}>4 ranks</MenuItem>
                            <MenuItem value={5}>5 ranks</MenuItem>
                            <MenuItem value={10}>10 ranks</MenuItem>
                        </Select>
                    </FormControl>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <FormControl>
                        <InputLabel htmlFor="itemCountSelect">itemCount</InputLabel>
                        <Select
                            value={this.state.itemCount}
                            onChange={event => {
                                console.log(`change itemCount to ${event.target.value}`);
                                this.setState({itemCount: event.target.value});
                            }}
                            inputProps={{
                                name: 'itemCount',
                                id: 'itemCountSelect',
                            }}
                        >
                            <MenuItem value={4}>4 item</MenuItem>
                            <MenuItem value={8}>8 items</MenuItem>
                            <MenuItem value={10}>10 items</MenuItem>
                            <MenuItem value={12}>12 items</MenuItem>
                            <MenuItem value={16}>16 items</MenuItem>
                            <MenuItem value={20}>20 items</MenuItem>
                        </Select>
                    </FormControl>
                </div>
                <LabeledSlider name={'rankCount'} value={this.state.rankCount} min={1} max={10}
                               handler={(event, value) => {
                                   console.log(`change rankCount to ${value}`);
                                   this.setState({rankCount: value});
                               }}/>
                <LabeledSlider name={'itemCount'} value={this.state.itemCount} min={1} max={20}
                               handler={(event, value) => {
                                   console.log(`change itemCount to ${value}`);
                                   this.setState({itemCount: value});
                               }}/>
            </div>
        );
    }
}