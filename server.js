const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let command = "NONE";

// ----------------------------------
// HOME PAGE
// ----------------------------------

app.get("/", (req, res) => {
    res.send("Mi Speaker server running");
});

// ----------------------------------
// ANDROID PHONE READS COMMAND
// ----------------------------------

app.get("/command", (req, res) => {
    res.json({
        command: command
    });
});

// ----------------------------------
// MANUAL TEST COMMANDS
// ----------------------------------

app.get("/play", (req, res) => {
    command = "PLAY";
    res.send("PLAY");
});

app.get("/pause", (req, res) => {
    command = "PAUSE";
    res.send("PAUSE");
});

app.get("/volup", (req, res) => {
    command = "VOLUP";
    res.send("VOLUP");
});

app.get("/voldown", (req, res) => {
    command = "VOLDOWN";
    res.send("VOLDOWN");
});

app.get("/next", (req, res) => {
    command = "NEXT";
    res.send("NEXT");
});

app.get("/previous", (req, res) => {
    command = "PREVIOUS";
    res.send("PREVIOUS");
});

app.get("/clear", (req, res) => {
    command = "NONE";
    res.send("CLEARED");
});

// ----------------------------------
// SIMPLE TEST OAUTH
// For personal testing only
// ----------------------------------

app.get("/auth", (req, res) => {

    const redirectUri = req.query.redirect_uri;
    const state = req.query.state;

    if (!redirectUri) {
        return res.status(400).send("Missing redirect_uri");
    }

    const code = "mi-speaker-code";

    const separator =
        redirectUri.includes("?") ? "&" : "?";

    res.redirect(
        redirectUri +
        separator +
        "code=" + encodeURIComponent(code) +
        "&state=" + encodeURIComponent(state || "")
    );
});


app.post("/token", (req, res) => {

    res.json({
        token_type: "Bearer",
        access_token: "mi-speaker-access-token",
        refresh_token: "mi-speaker-refresh-token",
        expires_in: 3600
    });

});

// ----------------------------------
// GOOGLE HOME FULFILLMENT
// ----------------------------------

app.post("/fulfillment", (req, res) => {

    const requestId = req.body.requestId;
    const intent =
        req.body.inputs &&
        req.body.inputs[0] &&
        req.body.inputs[0].intent;

    console.log("Google intent:", intent);

    // ---------- SYNC ----------

    if (intent === "action.devices.SYNC") {

        return res.json({

            requestId: requestId,

            payload: {

                agentUserId: "mi-speaker-user",

                devices: [

                    {

                        id: "mi-speaker-1",

                        type:
                            "action.devices.types.SPEAKER",

                        traits: [
                            "action.devices.traits.OnOff",
                            "action.devices.traits.Volume",
                            "action.devices.traits.TransportControl"
                        ],

                        name: {
                            name: "Mi Speaker"
                        },

                        willReportState: false,

                        attributes: {

                            volumeMaxLevel: 100,

                            volumeCanMuteAndUnmute: false,

                            commandOnlyVolume: true,

                            transportControlSupportedCommands: [
                                "PAUSE",
                                "RESUME",
                                "NEXT",
                                "PREVIOUS"
                            ]

                        },

                        deviceInfo: {
                            manufacturer: "DIY",
                            model: "Mi Speaker Bridge",
                            hwVersion: "1",
                            swVersion: "1"
                        }

                    }

                ]

            }

        });

    }


    // ---------- QUERY ----------

    if (intent === "action.devices.QUERY") {

        return res.json({

            requestId: requestId,

            payload: {

                devices: {

                    "mi-speaker-1": {
                        online: true,
                        on: true,
                        currentVolume: 50
                    }

                }

            }

        });

    }


    // ---------- EXECUTE ----------

    if (intent === "action.devices.EXECUTE") {

        try {

            const executions =
                req.body.inputs[0]
                    .payload.commands[0]
                    .execution;

            executions.forEach(execution => {

                const cmd = execution.command;
                const params = execution.params || {};

                console.log(cmd, params);

                // Play / Pause / Next / Previous

                if (
                    cmd ===
                    "action.devices.commands.mediaPause"
                ) {
                    command = "PAUSE";
                }

                if (
                    cmd ===
                    "action.devices.commands.mediaResume"
                ) {
                    command = "PLAY";
                }

                if (
                    cmd ===
                    "action.devices.commands.mediaNext"
                ) {
                    command = "NEXT";
                }

                if (
                    cmd ===
                    "action.devices.commands.mediaPrevious"
                ) {
                    command = "PREVIOUS";
                }

                // Volume relative

                if (
                    cmd ===
                    "action.devices.commands.relativeVolume"
                ) {

                    if (params.relativeSteps > 0) {
                        command = "VOLUP";
                    }

                    if (params.relativeSteps < 0) {
                        command = "VOLDOWN";
                    }

                }

            });


            return res.json({

                requestId: requestId,

                payload: {

                    commands: [

                        {

                            ids: [
                                "mi-speaker-1"
                            ],

                            status: "SUCCESS",

                            states: {
                                online: true,
                                on: true
                            }

                        }

                    ]

                }

            });


        } catch (error) {

            console.log(error);

        }

    }


    res.status(400).json({
        error: "Unknown intent"
    });

});


// ----------------------------------
// START SERVER
// ----------------------------------

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "Mi Speaker server started on port " +
        PORT
    );

});
