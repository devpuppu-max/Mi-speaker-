const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// SPEAKER STATE
// ==========================================

let pendingCommand = {
    command: "NONE"
};

let isOn = true;
let playbackState = "PAUSED";
let activityState = "ACTIVE";
let currentVolume = 50;


// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {

    res.send("Mi Speaker Google Home bridge running");

});


// ==========================================
// ANDROID APP READS COMMAND
// ==========================================

app.get("/command", (req, res) => {

    res.json(pendingCommand);

});


// ==========================================
// CLEAR COMMAND
// ==========================================

app.get("/clear", (req, res) => {

    pendingCommand = {
        command: "NONE"
    };

    res.json({
        success: true
    });

});


// ==========================================
// MANUAL TEST COMMANDS
// ==========================================

app.get("/play", (req, res) => {

    pendingCommand = {
        command: "PLAY"
    };

    playbackState = "PLAYING";

    res.json({
        command: "PLAY"
    });

});


app.get("/pause", (req, res) => {

    pendingCommand = {
        command: "PAUSE"
    };

    playbackState = "PAUSED";

    res.json({
        command: "PAUSE"
    });

});


app.get("/next", (req, res) => {

    pendingCommand = {
        command: "NEXT"
    };

    res.json({
        command: "NEXT"
    });

});


app.get("/previous", (req, res) => {

    pendingCommand = {
        command: "PREVIOUS"
    };

    res.json({
        command: "PREVIOUS"
    });

});


app.get("/volup", (req, res) => {

    currentVolume =
        Math.min(100, currentVolume + 5);

    pendingCommand = {
        command: "VOLUME",
        value: currentVolume
    };

    res.json(pendingCommand);

});


app.get("/voldown", (req, res) => {

    currentVolume =
        Math.max(0, currentVolume - 5);

    pendingCommand = {
        command: "VOLUME",
        value: currentVolume
    };

    res.json(pendingCommand);

});


// ==========================================
// SET VOLUME MANUALLY
//
// Example:
// /volume/40
// ==========================================

app.get("/volume/:level", (req, res) => {

    let level =
        parseInt(req.params.level);

    if (isNaN(level)) {

        return res.status(400).json({
            error: "Invalid volume"
        });

    }

    level =
        Math.max(
            0,
            Math.min(100, level)
        );

    currentVolume = level;

    pendingCommand = {
        command: "VOLUME",
        value: currentVolume
    };

    res.json(pendingCommand);

});


// ==========================================
// MUTE
// ==========================================

app.get("/mute", (req, res) => {

    pendingCommand = {
        command: "MUTE"
    };

    res.json({
        command: "MUTE"
    });

});


app.get("/unmute", (req, res) => {

    pendingCommand = {
        command: "UNMUTE"
    };

    res.json({
        command: "UNMUTE"
    });

});


// ==========================================
// TEST OAUTH
// ==========================================

app.get("/auth", (req, res) => {

    const redirectUri =
        req.query.redirect_uri;

    const state =
        req.query.state;

    if (!redirectUri) {

        return res
            .status(400)
            .send("Missing redirect_uri");

    }

    const code =
        "mi-speaker-code";

    const separator =
        redirectUri.includes("?")
            ? "&"
            : "?";

    res.redirect(
        redirectUri +
        separator +
        "code=" +
        encodeURIComponent(code) +
        "&state=" +
        encodeURIComponent(state || "")
    );

});


// ==========================================
// TOKEN
// ==========================================

app.post("/token", (req, res) => {

    res.json({

        token_type:
            "Bearer",

        access_token:
            "mi-speaker-access-token",

        refresh_token:
            "mi-speaker-refresh-token",

        expires_in:
            3600

    });

});


// ==========================================
// GOOGLE HOME FULFILLMENT
// ==========================================

app.post("/fulfillment", (req, res) => {

    console.log(
        JSON.stringify(
            req.body,
            null,
            2
        )
    );

    const requestId =
        req.body.requestId;

    const input =
        req.body.inputs &&
        req.body.inputs[0];


    if (!input) {

        return res.status(400).json({

            requestId:
                requestId,

            error:
                "No input"

        });

    }


    const intent =
        input.intent;


    console.log(
        "Google intent:",
        intent
    );


    // ======================================
    // SYNC
    // ======================================

    if (
        intent ===
        "action.devices.SYNC"
    ) {

        return res.json({

            requestId:
                requestId,

            payload: {

                agentUserId:
                    "mi-speaker-user",

                devices: [

                    {

                        id:
                            "mi-speaker-1",

                        type:
                            "action.devices.types.SPEAKER",

                        traits: [

                            "action.devices.traits.MediaState",

                            "action.devices.traits.OnOff",

                            "action.devices.traits.Volume",

                            "action.devices.traits.TransportControl"

                        ],

                        name: {

                            defaultNames: [
                                "Mi Speaker"
                            ],

                            name:
                                "Mi Speaker",

                            nicknames: [
                                "Bluetooth Speaker"
                            ]

                        },

                        willReportState:
                            false,

                        attributes: {

                            transportControlSupportedCommands: [

                                "NEXT",
                                "PREVIOUS",
                                "PAUSE",
                                "RESUME"

                            ],

                            volumeMaxLevel:
                                100,

                            volumeCanMuteAndUnmute:
                                true,

                            volumeDefaultPercentage:
                                50,

                            levelStepSize:
                                5,

                            commandOnlyVolume:
                                false,

                            supportActivityState:
                                true,

                            supportPlaybackState:
                                true

                        },

                        deviceInfo: {

                            manufacturer:
                                "DIY",

                            model:
                                "Mi Speaker Bridge",

                            hwVersion:
                                "1",

                            swVersion:
                                "3"

                        }

                    }

                ]

            }

        });

    }


    // ======================================
    // QUERY
    // ======================================

    if (
        intent ===
        "action.devices.QUERY"
    ) {

        return res.json({

            requestId:
                requestId,

            payload: {

                devices: {

                    "mi-speaker-1": {

                        online:
                            true,

                        on:
                            isOn,

                        currentVolume:
                            currentVolume,

                        isMuted:
                            false,

                        activityState:
                            activityState,

                        playbackState:
                            playbackState

                    }

                }

            }

        });

    }


    // ======================================
    // EXECUTE
    // ======================================

    if (
        intent ===
        "action.devices.EXECUTE"
    ) {

        const commandGroups =
            input.payload &&
            input.payload.commands;


        if (!commandGroups) {

            return res.status(400).json({

                requestId:
                    requestId,

                error:
                    "No commands"

            });

        }


        const responseCommands =
            [];


        commandGroups.forEach(
            commandGroup => {

                const ids =
                    commandGroup.devices.map(
                        device =>
                            device.id
                    );


                commandGroup.execution.forEach(
                    execution => {

                        const googleCommand =
                            execution.command;

                        const params =
                            execution.params || {};


                        console.log(
                            "Google command:",
                            googleCommand,
                            params
                        );


                        // ==================
                        // PAUSE
                        // ==================

                        if (
                            googleCommand ===
                            "action.devices.commands.mediaPause"
                        ) {

                            pendingCommand = {
                                command: "PAUSE"
                            };

                            playbackState =
                                "PAUSED";

                        }


                        // ==================
                        // RESUME
                        // ==================

                        else if (
                            googleCommand ===
                            "action.devices.commands.mediaResume"
                        ) {

                            pendingCommand = {
                                command: "PLAY"
                            };

                            playbackState =
                                "PLAYING";

                        }


                        // ==================
                        // NEXT
                        // ==================

                        else if (
                            googleCommand ===
                            "action.devices.commands.mediaNext"
                        ) {

                            pendingCommand = {
                                command: "NEXT"
                            };

                        }


                        // ==================
                        // PREVIOUS
                        // ==================

                        else if (
                            googleCommand ===
                            "action.devices.commands.mediaPrevious"
                        ) {

                            pendingCommand = {
                                command: "PREVIOUS"
                            };

                        }


                        // ==================
                        // SET VOLUME
                        // ==================

                        else if (
                            googleCommand ===
                            "action.devices.commands.setVolume"
                        ) {

                            let wanted =
                                Number(
                                    params.volumeLevel
                                );

                            wanted =
                                Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        wanted
                                    )
                                );

                            currentVolume =
                                wanted;

                            pendingCommand = {

                                command:
                                    "VOLUME",

                                value:
                                    currentVolume

                            };

                        }


                        // ==================
                        // RELATIVE VOLUME
                        // ==================

                        else if (
                            googleCommand ===
                            "action.devices.commands.volumeRelative"
                        ) {

                            const steps =
                                Number(
                                    params.relativeSteps ||
                                    0
                                );

                            currentVolume =
                                Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        currentVolume +
                                        steps
                                    )
                                );

                            pendingCommand = {

                                command:
                                    "VOLUME",

                                value:
                                    currentVolume

                            };

                        }


                        // ==================
                        // MUTE
                        // ==================

                        else if (
                            googleCommand ===
                            "action.devices.commands.mute"
                        ) {

                            if (params.mute) {

                                pendingCommand = {
                                    command: "MUTE"
                                };

                            } else {

                                pendingCommand = {
                                    command: "UNMUTE"
                                };

                            }

                        }


                        // ==================
                        // ON / OFF
                        // ==================

                        else if (
                            googleCommand ===
                            "action.devices.commands.OnOff"
                        ) {

                            isOn =
                                !!params.on;

                            if (isOn) {

                                pendingCommand = {
                                    command: "PLAY"
                                };

                                playbackState =
                                    "PLAYING";

                            } else {

                                pendingCommand = {
                                    command: "PAUSE"
                                };

                                playbackState =
                                    "PAUSED";

                            }

                        }

                    }
                );


                responseCommands.push({

                    ids:
                        ids,

                    status:
                        "SUCCESS",

                    states: {

                        online:
                            true,

                        on:
                            isOn,

                        currentVolume:
                            currentVolume,

                        isMuted:
                            false,

                        activityState:
                            activityState,

                        playbackState:
                            playbackState

                    }

                });

            }
        );


        return res.json({

            requestId:
                requestId,

            payload: {

                commands:
                    responseCommands

            }

        });

    }


    // ======================================
    // UNKNOWN INTENT
    // ======================================

    return res.status(400).json({

        requestId:
            requestId,

        error:
            "Unknown intent"

    });

});


// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        "Mi Speaker server started on port " +
        PORT
    );

});
