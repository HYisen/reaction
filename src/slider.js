import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography'
import React from "react";

export function LabeledSlider(props) {
    const name = props.name;
    const composedId = `${name}Slider`;
    return (
        <div className={'slider'}>
            <Typography id={composedId} variant='subtitle1'>{name}</Typography>
            <Slider
                value={props.value}
                min={props.min}
                max={props.max}
                step={1}
                aria-labelledby={composedId}
                onChange={props.handler}
            />
        </div>
    );
}