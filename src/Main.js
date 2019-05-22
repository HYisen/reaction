import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

import TextField from '@material-ui/core/TextField';

import Button from '@material-ui/core/Button';

import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';

import Cookies from 'universal-cookie'
import Fab from '@material-ui/core/Fab';
import {Refresh} from '@material-ui/icons';


function TabContainer(props) {
    return (
        <Typography component="div" style={{padding: 8}}>
            {props.children}
        </Typography>
    );
}

TabContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

class Item {
    clazz;
    message;
    timestamp;

    constructor(clazz, message) {
        this.clazz = clazz;
        this.message = message;
        this.timestamp = Date.now();
    }

    getClsColor() {
        switch (this.clazz) {
            case "server":
                return "primary";
            case "client":
                return "secondary";
            case "info":
                return "default";
            default:
                return "error"
        }
    }
}

//Bookmark
class Shiori {
    bookName;
    chapterName;
    bookIndex;
    chapterIndex;
    maxIndex;

    map = {};//bookIndex->chapterIndex

    load = (self) => {
        const info = self.cookie.get('shiori');
        if (info !== undefined) {
            Object.assign(this, info);
            console.log(`reconstruct shiori to:`);
            console.log(this);
        }
    };

    save = (self) => {
        self.cookie.set('shiori', JSON.stringify(this));
    };
}

const styles = theme => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        // align
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 200,
    },
    button: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 50,
        marginTop: 28,
    },
    paper: {
        padding: theme.spacing.unit,
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    card: {
        // maxWidth: 400,
    },
    text: {
        'text-indent': '2em',
    },
    info: {
        'text-align': 'center',
    },
    fab: {
        margin: theme.spacing.unit,
        top: theme.spacing.unit,
        right: theme.spacing.unit,
        bottom: 'auto',
        left: 'auto',
        position: 'fixed',
    },
});

function MyButton(props) {
    return (
        <Button className={props.className} onClick={props.onclick} variant="contained" color={props.color}>
            {props.content}
        </Button>
    );
}

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = '443';

class Main extends React.Component {
    state = {
        tab: 0,
        host: DEFAULT_HOST,
        port: DEFAULT_PORT,
        message: '',
        info: [],
        count: 0,
        linked: false,
        content: [],
        item: '.',
        loaded: false,
    };

    handleChange = name => (event, value) => {
        console.log(`set ${name} to ${value}`);
        this.setState({[name]: value});
    };

    handleTarget = name => event => {
        this.setState({[name]: event.target.value});
    };

    componentDidMount() {
        this.cookie = new Cookies();
        this.bookmark = new Shiori();
        this.bookmark.load(this);

        let oldHost = this.cookie.get('host');
        let oldPort = this.cookie.get('port');
        this.setState({
            host: oldHost === undefined ? this.state.host : oldHost,
            port: oldPort === undefined ? this.state.port : Number(oldPort)
        });
    }

    componentWillUnmount() {
    }

    showMessage = (cls, msg) => {
        this.state.info.unshift(new Item(cls, msg));
        this.setState({
            count: this.state.count + 1,
        });
    };

    manageMessage = (expectType) => {
        let cmd;
        switch (expectType) {
            case "SHELF":
            case "BOOK":
                cmd = 'ls';
                break;
            case "CHAPTER":
                cmd = 'get';
                break;
            default:
                throw new TypeError(`BAD expectType ${expectType}`);
        }

        this.socket.send(`${cmd} ${this.state.item}`);
        let temp = this.socket.onmessage;
        this.socket.onmessage = (event) => {
            let input = null;
            try {
                input = JSON.parse(event.data);//keep calm.
            } catch (e) {
                console.log("failed to parse msg:\n" + event.data);
                return;
            }

            if (input.type === expectType) {
                switch (expectType) {
                    case "BOOK":
                        this.bookmark.maxIndex = input.content.length;
                        this.bookmark.bookName = input.name;
                        this.bookmark.bookIndex = Number(this.state.item);
                        break;
                    case "CHAPTER":
                        this.bookmark.chapterName = input.name;
                        this.bookmark.chapterIndex = Number(this.state.item.substr(
                            this.state.item.indexOf('.') + 1));
                        this.bookmark.map[this.bookmark.bookIndex] = this.bookmark.chapterIndex;
                        this.bookmark.save(this);
                        break;
                    default:
                }
                this.setState({content: input.content, loaded: true});
                this.socket.onmessage = temp;
            }
        };
    };

    onLinkButtonAction = () => {
        if (!this.state.linked) {
            this.cookie.set('host', this.state.host);
            this.cookie.set('port', this.state.port);

            this.relink();
        } else {
            console.log(`close`);
            this.socket.close();
        }
    };

    reload = () => {
        let temp = this.socket.onmessage;
        this.socket.onmessage = (event) => {
            if (event.data === 'reloaded') {
                this.socket.onmessage = temp;
                this.setState({loaded: false});
            } else {
                throw new Error("unexpected reload return:" + event.data);
            }
        };
        this.socket.send('reload');
    };

    relink = () => {
        if (!this.state.linked) {
            setTimeout(null, 1000);
            let oldSocket = this.socket;
            if (oldSocket == null) {
                console.log("link");

                oldSocket = {};//dummy data container
                oldSocket.onopen = () => {
                    this.showMessage('info', 'opened');
                    this.setState({linked: true});
                };
                oldSocket.onclose = () => {
                    this.showMessage('info', 'closed');
                    this.setState({linked: false});
                };
                oldSocket.onerror = (event) => {
                    this.showMessage('info', 'error=' + event);
                };
                oldSocket.onmessage = (event) => {
                    this.showMessage('server', event.data);
                };
            } else {
                console.log("relink");
            }

            const addr = `ws://${this.state.host}:${this.state.port}/ws`;
            console.log(`link to ${addr}`);

            this.socket = new WebSocket(addr);
            this.socket.onopen = oldSocket.onopen;
            this.socket.onclose = oldSocket.onclose;
            this.socket.onerror = oldSocket.onerror;
            this.socket.onmessage = oldSocket.onmessage;
        }
    };

    onSendButtonAction = () => {
        this.showMessage('client', `${this.state.message}`);
        this.socket.send(this.state.message);
        this.setState({message: ''});
    };

    render() {
        const {classes} = this.props;
        const tab = this.state.tab;
        let cnt = this.state.count;
        const papers = this.state.info.map((item) =>
            <Grid item key={cnt--}>
                <Paper className={classes.paper}>
                    <Grid container
                          direction="column"
                          justify="flex-start"
                          alignItems="flex-start">
                        <Grid item container
                              direction="row"
                              justify="space-between"
                              alignItems="center"
                        >
                            <Grid item>
                                <Typography variant="subtitle1" component="h4" color={item.getClsColor()}>
                                    {item.clazz}
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Typography variant="subtitle2" component="h6">
                                    {new Date(item.timestamp).toLocaleString()}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Typography variant="body1" component="p">
                                {item.message}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        );
        let button;
        if (!this.state.linked) {
            button = <MyButton className={classes.button} content={'OFF'} onclick={this.onLinkButtonAction}
                               color={"secondary"}/>;
        } else {
            button = <MyButton className={classes.button} content={'ON'} onclick={this.onLinkButtonAction}
                               color={"primary"}/>;
        }

        let pos = -1;
        if (this.state.tab === 1) {
            pos = this.state.item.indexOf('.');
        }

        let fab = '';
        if (!this.state.linked) {
            fab =
                <Fab color="secondary" aria-label="ReLink"
                     className={classes.fab} onClick={this.relink}>
                    <Refresh/>
                </Fab>;
        } else if (this.state.loaded && this.state.tab === 1 && pos === 0) {
            //loaded reader shelf
            fab =
                <Fab color="primary" aria-label="ReLoad"
                     className={classes.fab} onClick={this.reload}>
                    <Refresh/>
                </Fab>;
        }

        let reader = '';
        if (this.state.tab === 1) {
            switch (pos) {
                case 0:
                    //shelf
                    if (this.state.loaded) {
                        let cnt = -1;
                        let books = this.state.content.map(title =>
                            <Grid item key={++cnt}>
                                {/*<Paper className={classes.paper}  onClick={((count)=>()=>console.log(`click ${count}`))(cnt)}>*/}
                                {/*{`《${title}》`}*/}
                                {/*</Paper>*/}
                                <Card className={classes.card}>
                                    <CardActionArea onClick={((count) => () => {
                                        console.log(`click ${count}`);
                                        // let cnt = this.state.content.filter(name => name !== this.state.content[count]);
                                        // console.log(cnt);
                                        // this.setState({content: cnt});
                                        this.setState({item: `${count}`, loaded: false});
                                    })(cnt)}>
                                        <CardContent className={classes.info}>
                                            {`《${title}》`}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>);


                        // drop the possible modification on bookmark by read of book's table of content
                        this.bookmark.load(this);

                        reader = <Grid
                            container
                            direction="column"
                            justify="flex-start"
                            alignItems="stretch"
                            spacing={8}
                        >
                            {this.bookmark.bookName !== undefined &&
                            <Grid item key={++cnt}>
                                <Card className={classes.card}>
                                    <CardActionArea onClick={() => {
                                        this.setState({
                                            item: `${this.bookmark.bookIndex}.${this.bookmark.chapterIndex}`,
                                            loaded: false
                                        });
                                    }}>
                                        <CardContent>
                                            {`last read ->《${this.bookmark.bookName}》\t${this.bookmark.chapterName}`}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                            }
                            {books}
                        </Grid>;
                    } else if (this.state.linked === true) {
                        console.log("load shelf");
                        this.manageMessage('SHELF');
                    }
                    break;
                case -1:
                    //book
                    if (this.state.loaded) {
                        let cnt = -1;
                        let chapters = this.state.content.map(title =>
                            <Grid item key={++cnt}>
                                <Card className={classes.card}>
                                    <CardActionArea onClick={((count) => () => {
                                        console.log(`click ${count}`);
                                        this.setState({item: `${this.state.item}.${count}`, loaded: false});
                                    })(cnt)}>
                                        <CardContent className={classes.info}>
                                            {`${title}`}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>).reverse();
                        const chapterIndex = this.bookmark.map[this.bookmark.bookIndex];
                        reader = <Grid
                            container
                            direction="column"
                            justify="flex-start"
                            alignItems="stretch"
                            spacing={8}
                        >
                            <Grid item key={++cnt}>
                                <Card className={classes.card}>
                                    <CardActionArea onClick={((count) => () => {
                                        console.log(`click FINAL at ${count}`);
                                        this.setState({item: '.', loaded: false});
                                    })(cnt)}>
                                        <CardContent className={classes.info}>
                                            {`《${this.bookmark.bookName}》`}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                            {chapterIndex &&
                            <Grid item key={++cnt}>
                                <Card className={classes.card}>
                                    <CardActionArea onClick={(() => () => {
                                        console.log(`click shiori of ${this.bookmark}`);
                                        this.setState({
                                            item: `${this.bookmark.bookIndex}.${chapterIndex}`,
                                            loaded: false
                                        });
                                    })(cnt)}>
                                        <CardContent>
                                            {`last read -> ${this.state.content[chapterIndex]}`}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                            }
                            {chapters}
                        </Grid>;
                    } else if (this.state.linked === true) {
                        console.log(`load table of contents of ${this.state.item}`);
                        this.manageMessage('BOOK');
                    }
                    break;
                default:
                    //chapter
                    if (this.state.loaded) {
                        let cnt = 0;
                        reader = <Grid
                            container
                            direction="column"
                            justify="flex-start"
                            alignItems="stretch"
                            spacing={8}
                        >
                            <Grid item key={0}>
                                <Card className={classes.card}>
                                    <CardActionArea onClick={() => {
                                        this.setState({item: this.state.item.slice(0, pos), loaded: false});
                                    }}>
                                        <CardContent className={classes.info}>
                                            {`《${this.bookmark.bookName}》\t${this.bookmark.chapterName}`}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                            <Grid item key={1}>
                                <Card className={classes.card}>
                                    <CardContent className={classes.text}>
                                        {this.state.content.map(line => <p key={cnt++}>{line}</p>)}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {this.bookmark.chapterIndex + 1 < this.bookmark.maxIndex &&
                            <Grid item key={2}>
                                <Card className={classes.card}>
                                    <CardActionArea onClick={() => {
                                        this.setState({
                                            item: `${this.bookmark.bookIndex}.${this.bookmark.chapterIndex + 1}`,
                                            loaded: false
                                        });
                                    }}>
                                        <CardContent>
                                            {"NEXT"}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>}
                        </Grid>;
                    } else if (this.state.linked === true) {
                        console.log(`load chapter ${this.state.item}`);
                        this.manageMessage('CHAPTER');
                    }
                    break;
            }
        }

        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Tabs value={tab} variant="fullWidth" onChange={this.handleChange('tab')}>
                        <Tab label="Config"/>
                        <Tab label="Reader"/>
                    </Tabs>
                </AppBar>
                {tab === 0 &&
                <TabContainer>
                    <form className={classes.container} noValidate autoComplete="off">
                        <TextField
                            id="host-text"
                            label="host"
                            className={classes.textField}
                            value={this.state.host}
                            onChange={this.handleTarget('host')}
                            margin="normal"
                            style={{width: 200}}
                        />
                        <TextField
                            id="port-text"
                            label="port"
                            className={classes.textField}
                            value={this.state.port}
                            onChange={this.handleTarget('port')}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            margin="normal"
                            type="number"
                            style={{width: 78}}
                        />
                        <div>
                            {button}
                        </div>
                    </form>
                    <form className={classes.container} noValidate autoComplete="off">
                        <TextField
                            id="message-text"
                            label="message"
                            className={classes.textField}
                            value={this.state.message}
                            onChange={this.handleTarget('message')}
                            margin="normal"
                            variant="outlined"
                            style={{width: 295}}
                        />
                        <div>
                            <Button variant="contained" color="primary"
                                    className={classes.button}
                                    onClick={this.onSendButtonAction}>
                                Send
                            </Button>
                        </div>
                    </form>
                    <Grid
                        container
                        direction="column"
                        justify="flex-start"
                        alignItems="stretch"
                        spacing={8}
                    >
                        {papers}
                    </Grid>
                </TabContainer>}
                {tab === 1 &&
                <TabContainer>
                    {reader}
                    {fab}
                </TabContainer>}
            </div>
        );
    }
}

Main.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Main);