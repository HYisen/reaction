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
            timestamp: props.timestamp,
            status: props.status
        };
    }

    update = () => {
        console.log('update');
        const url = 'http://ol.tinylink.cn/onelink/project_module/project_control.php?type=rawData&dataSource=2206';
        fetch(url)
            .then(response => response.json())
            .then(json => json['data'][2206])
            .then(cnt => {
                const lumiThreshold = 100;

                const lumi = parseInt(cnt['value']);
                const time = new Date(cnt['time']);

                console.log(lumi);
                console.log(time);
                if (time.valueOf() > this.state.timestamp.valueOf()) {
                    this.setState({timestamp: time});
                    const status = lumi > lumiThreshold;
                    if (status !== this.state.status) {
                        this.setState({status: status});
                        this.manage(status, time);
                    }
                }
            });
    };

    //Only changed status should be passed to there.
    manage = (newStatus, newTime) => {
        const minute = newTime.getMinutes();
        const second = newTime.getSeconds();

        if (newTime.getHours() !== this.oldTime.getHours()) {
            this.oldTime = newTime;
            this.statData = new Array(60);
            this.statData.fill(new Array(60));
        }
        if (minute !== this.oldTime.getMinutes()) {
            console.log(`${minute}: on for ${this.onCount} secs , switch ${this.actionCount} times`);
            for (let k = 0; k < this.statData[minute].length; k++) {
                let one = this.statData[minute][k];
                if (one !== null) {
                    console.log(`${this.statData[minute][k] ? 1 : 0} : ${k}`);
                }
            }
            this.actionCount = 0;
        }

        this.statData[minute][second] = newStatus;
        this.actionCount += 1;
        let previous = null;
        let onCount = 0;
        for (let k = 0; k < this.statData[minute][second]; k++) {
            let one = this.statData[minute][k];
            if (one !== null) {
                if (previous === null) {
                    if (one) {
                        onCount += k;
                    }
                } else if (previous === true) {
                    onCount += 1;
                }
                previous = one;
            }
        }
        this.onCount = onCount;
        console.log(`${onCount} of ${second}`);
    };

    componentDidMount() {
        this.timerID0 = setInterval(() => this.update(), 2000);
        // this.timerID1 = setInterval(() => this.manageData(), 1000 * 60);

        this.oldTime = new Date(0);

        let canvas = document.getElementById("canvas");
        this.ctx = canvas.getContext('2d');
        this.paint(this.ctx);
    }

    componentWillUnmount() {
        clearInterval(this.timerID0);
        // clearInterval(this.timerID1);
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
            console.log("grid");
            grid();
            grid(50);
        }

        ctx.fillStyle = 'red';

        let usage = [0.2, 0.1, 0.5, 0.6, 0.8, 0.9, 1.0, 0.4];
        let count = [10, 6, 5, 20, 4, 2, 0, 14];

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
        const calTime = k => {
            if (itemCount > 10) {
                return (45 - k * 1);
            } else {
                return '12' + (45 - k * 1);
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
        console.log(`render with grid ${this.state.showGrid}`);
        if (this.ctx) {
            this.paint(this.ctx);
        }
        console.log(`count=${this.state.rankCount}`);
        return (
            <div>
                <p>last_rx = {this.state.timestamp.toISOString()} &nbsp;&nbsp;&nbsp;&nbsp;
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