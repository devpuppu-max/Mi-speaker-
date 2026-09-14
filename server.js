const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let command = "NONE";

// Track basic speaker state
let isOn = true;
let playbackState = "PAUSED";
let activityState = "ACTIVE";
let currentVolume = 50;


// ==============================
// HOME PAGE
// ==============================

app.get("/", (req, res) => {
    res.send("Mi Speaker server running");
});


// ==============================
// ANDROID PHONE READS COMMAND
// ==============================

app.get("/command", (req, res) => {
    res.json({
        command: command
    });
});


// ==============================
// CLEAR COMMAND
// ==============================

app.get("/clear", (req, res) => {
    command = "NONE";

    res.json({
        command: "NONE"
    });
});


// ==============================
// MANUAL TEST COMMANDS
// ==============================

app.get("/play", (req, res) => {

    command = "PLAY";
    playbackState = "PLAYING";

    res.send("PLAY");
});


app.get("/pause", (req, res) => {

    command = "PAUSE";
    playbackState = "PAUSED";

    res.send("PAUSE");
});


app.get("/next", (req, res) => {

    command = "NEXT";

    res.send("NEXT");
});


app.get("/previous", (req, res) => {

    command = "PREVIOUS";

    res.send("PREVIOUS");
});


app.get("/volup", (req, res) => {

    command = "VOLUP";

    if (currentVolume < 100) {
        currentVolume++;
    }

    res.send("VOLUP");
});


app.get("/voldown", (req, res) => {

    command = "VOLDOWN";

    if (currentVolume > 0) {
        currentVolume--;
    }

    res.send("VOLDOWN");
});


// ==============================
// TEST OAUTH
// Personal testing only
// ==============================

app.get("/auth", (req, res) => {

    const redirectUri = req.query.redirect_uri;
    const state = req.query.state;

    if (!redirectUri) {
        return res.status(400).send(
            "Missing redirect_uri"
        );
    }

    const code = "mi-speaker-code";

    const separator =
        redirectUri.includes("?") ? "&" : "?";

    res.redirect(
        redirectUri +
        separator +
        "code=" +
        encodeURIComponent(code) +
        "&state=" +
        encodeURIComponent(state || "")
    );
});


app.post("/token", (req, res) => {

    res.json({
        token_type: "Bearer",
        access_token:
            "mi-speaker-access-token",
        refresh_token:
            "mi-speaker-refresh-token",
        expires_in: 3600
    });

});


// ==============================
// GOOGLE HOME FULFILLMENT
// ==============================

app.post("/fulfillment", (req, res) => {

    console.log(
        JSON.stringify(req.body, null, 2)
    );

    const requestId = req.body.requestId;

    const input =
        req.body.inputs &&
        req.body.inputs[0];

    if (!input) {

        return res.status(400).json({
            error: "No input"
        });
    }

    const intent = input.intent;

    console.log(
        "Google intent:",
        intent
    );


    // ==========================
    // SYNC
    // ==========================

    if (
        intent ===
        "action.devices.SYNC"
    ) {

        return res.json({

            requestId: requestId,

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

                            name:
                                "Mi Speaker"

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
                                false,

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
                                "2"
                        }

                    }

                ]

            }

        });
    }


    // ==========================
    // QUERY
    // ==========================

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

                        activityState:
                            activityState,

                        playbackState:
                            playbackState
                    }

                }

            }

        });

    }


    // ==========================
    // EXECUTE
    // ==========================

    if (
        intent ===
        "action.devices.EXECUTE"
    ) {

        const commands =
            input.payload &&
            input.payload.commands;

        if (!commands) {

            return res.status(400).json({
                error:
                    "No commands"
            });
        }


        const responseCommands = [];


        commands.forEach(
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


                        // ------------------
                        // PAUSE
                        // ------------------

                        if (
                            googleCommand ===
                            "action.devices.commands.mediaPause"
                        ) {

                            command =
                                "PAUSE";

                            playbackState =
                                "PAUSED";
                        }


                        // ------------------
                        // PLAY / RESUME
                        // ------------------

                        else if (
                            googleCommand ===
                            "action.devices.commands.mediaResume"
                        ) {

                            command =
                                "PLAY";

                            playbackState =
                                "PLAYING";
                        }


                        // ------------------
                        // NEXT
                        // ------------------

                        else if (
                            googleCommand ===
                            "action.devices.commands.mediaNext"
                        ) {

                            command =
                                "NEXT";
                        }


                        // ------------------
                        // PREVIOUS
                        // ------------------

                        else if (
                            googleCommand ===
                            "action.devices.commands.mediaPrevious"
                        ) {

                            command =
                                "PREVIOUS";
                        }


                        // ------------------
                        // VOLUME + / -
                        // ------------------

                        else if (
                            googleCommand ===
                            "action.devices.commands.volumeRelative"
                        ) {

                            const steps =
                                params.relativeSteps || 0;

                            if (steps > 0) {

                                command =
                                    "VOLUP";

                                currentVolume =
                                    Math.min(
                                        100,
                                        currentVolume +
                                        Math.abs(steps)
                                    );

                            }

                            else if (
                                steps < 0
                            ) {

                                command =
                                    "VOLDOWN";

                                currentVolume =
                                    Math.max(
                                        0,
                                        currentVolume -
                                        Math.abs(steps)
                                    );
                            }
                        }


                        // ------------------
                        // ABSOLUTE VOLUME
                        // ------------------

                        else if (
                            googleCommand ===
                            "action.devices.commands.setVolume"
                        ) {

                            const wanted =
                                params.volumeLevel;

                            if (
                                wanted >
                                currentVolume
                            ) {

                                command =
                                    "VOLUP";

                            }

                            else if (
                                wanted <
                                currentVolume
                            ) {

                                command =
                                    "VOLDOWN";
                            }

                            currentVolume =
                                wanted;
                        }


                        // ------------------
                        // ON / OFF
                        // ------------------

                        else if (
                            googleCommand ===
                            "action.devices.commands.OnOff"
                        ) {

                            isOn =
                                params.on;

                            if (
                                params.on
                            ) {

                                command =
                                    "PLAY";

                                playbackState =
                                    "PLAYING";

                            }

                            else {

                                command =
                                    "PAUSE";

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


    // ==========================
    // UNKNOWN INTENT
    // ==========================

    return res.status(400).json({

        requestId:
            requestId,

        error:
            "Unknown intent"

    });

});


// ==============================
// START SERVER
// ==============================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "Mi Speaker server started on port " +
        PORT
    );

});
