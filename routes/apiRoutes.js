var db = require("../models");
var passport = require('passport');
var spotifyClient = require("../controllers/spotify");


// var Sequelize = require('sequelize');
const Op = db.Sequelize.Op; // query operators

module.exports = function (app) {

    //
    // USERS
    //

    app.get("/api/users",
        require('connect-ensure-login').ensureLoggedIn('/login'),
        function (req, res) {
            console.log("api call");
            db.User.findAll({
                where: { admin: false }
            }).then(function (results) {
                console.log(`ran an all, got: `);
                console.log(results);
                res.json(results);
            });
        });

    app.put("/api/users/:id", (req, res) => {
        var idToUpdate = parseInt(req.params.id, 10);
        console.log(`PUT RECEIVED AT ${idToUpdate}`);
        console.log(req.body.username);
        console.log(req.body.password);
        db.User.update(
            {
                username: req.body.username,
                password: req.body.password
            }, {
                where: {
                    id: idToUpdate
                }
            }
        ).then(function (updatedUser) {
            console.log("updated user");
            console.log(updatedUser);
            res.end();
        });
    });

    app.delete("/api/users/:id", (req, res) => {
        var idToDelete = parseInt(req.params.id, 10);
        console.log(`idToDelete: ${idToDelete}`);
        db.User.destroy({
            where: {
                id: idToDelete
            }
        }).then(function (response) {
            console.log("Tried to delete just the one...");
            console.log(response);
            res.end();
        });
    });

    //
    // BANDS
    //

    app.get("/api/bands",
        require('connect-ensure-login').ensureLoggedIn('/login'),
        function (req, res) {
            console.log("api call");
            db.Band.findAll({}).then(function (results) {
                res.json(results);
            });
        });

    // currently wired up to expect POST directly from a form
    app.post("/api/bands", (req, res) => {
        console.log(req.body);
        var dateSwitch = {
            Thursday: 1,
            Friday: 2,
            Saturday: 3,
            Sunday: 4
        };
        console.log(dateSwitch[req.body.day]);
        var dayCalced = 6 + dateSwitch[req.body.day];
        console.log(`dayCalced: ${dayCalced}; time: ${parseInt(req.body.hours)}:${parseInt(req.body.minutes)}`);
        db.Band.create({
            name: req.body.name,
            stage: req.body.stage,
            time: new Date(2018, 05, dayCalced, parseInt(req.body.hours), parseInt(req.body.minutes)),
            day: req.body.day
        }).then(function (newBand) {
            console.log("New band!");
            console.log(newBand);
            res.redirect("/");
        });
    });

    app.delete("/api/bands/:id", (req, res) => {
        var idToDelete = parseInt(req.params.id, 10);
        console.log(`idToDelete: ${idToDelete}`);
        db.Band.destroy({
            where: {
                id: idToDelete
            }
        }).then(function (response) {
            console.log("Tried to delete just the one...");
            console.log(response);
            res.end();
        });
    });


    //
    // ALL
    //

    // TODO: Add administrative authentication requirement?
    app.delete("/api/all",
        require('connect-ensure-login').ensureLoggedIn('/login'),
        (req, res) => {
            db.User.destroy({
                where: {
                    admin: false
                }
            }).then(function (response) {
                db.Band.destroy({
                    where: {
                        id: { [Op.ne]: null }
                    }
                }).then(function (response) {
                    console.log("Tried to delete everything");
                    res.end();
                })
            });
        });


    //
    // BAND IMAGES FROM SPOTIFY
    //

    var walrus = new spotifyClient();

    // Respond with band data for one band when asked by the frontend
    app.get("/api/spotify/band/:name", function (req, res) {
        var bandName = req.params.name;
        walrus.artistSearch(bandName, function (result) {
            res.json({ result: result });
        })
    });


    //
    // BANDUSER RELATIONS
    //

    app.post("/api/banduser/", function (req, res) {
        var userToAdd = db.User.findOne({ where: { id: parseInt(req.body.userToAdd, 10) } });
        var bandToAdd = db.Band.findOne({ where: { id: parseInt(req.body.bandToAdd, 10) } });
        Promise.all([userToAdd, bandToAdd])
            .then((results) => {
                return results[0].addBand(results[1]);
            })
            .then((moreResults) => {
                res.json(moreResults);
            })
    });

    app.delete("/api/banduser/", function (req, res) {

        var userToRemove = db.User.findOne({ where: { id: parseInt(req.body.userToRemove, 10) } });
        var bandToRemove = db.Band.findOne({ where: { id: parseInt(req.body.bandToRemove, 10) } });
        Promise.all([userToRemove, bandToRemove])
            .then((results) => {
                return results[0].removeBand(results[1]);
            })
            .then((moreResults) => {
                res.json(moreResults);
            })
    });

    //
    // RATINGS
    //

    app.post("/api/rating", function (req, res) {
        db.BandUser.update(
            {
                rating: parseInt(req.body.rating, 10)
            }, {
                where: {
                    UserId: parseInt(req.body.user, 10),
                    BandId: parseInt(req.body.band, 10)
                }
            }
        ).then(function (updatedRating) {
            console.log("updated rating");
            console.log(updatedRating);
            res.send({message: "ok"});
        });
        // var userToAdd = db.User.findOne({ where: { id: parseInt(req.body.userToAdd, 10) } });
        // var bandToAdd = db.Band.findOne({ where: { id: parseInt(req.body.bandToAdd, 10) } });
        // Promise.all([userToAdd, bandToAdd])
        //     .then((results) => {
        //         // console.log("got some!");
        //         // console.log(results);
        //         return results[0].addBand(results[1]);
        //     })
        //     .then((moreResults) => {
        //         res.json(moreResults);
        //     })
        // res.json({});
    });

    //
    // REACT TEST ROUTES
    //


    // Routes to test connectivity with React frontend
    app.get("/react/test", function (req, res) {
        console.log('Got an AJAX request from React!');
         res.json({ success: true, message: 'this message came from the express server' });
    });


    // TODO: Fix this this is broken now and doesn't really do anything
    // app.get('/api/test/addmanytomany', function (req, res) {
    //     console.log("Here you are!");
    //     testObj = {
    //         name: "hello",
    //         testObj: true,
    //         hmm: [1, 2, "hello", 3, [0, 1, 2], "dog"],
    //         wellThen: 0
    //     }

    //     var admin = db.User.findOne({ where: { admin: true } });
    //     var band = db.Band.findOne({ where: { name: 'adminTestBandTwo' } });
    //     Promise.all([admin, band])
    //         .then((results) => {
    //             // TODO: Add the bad/user association call where did it go
    //             console.log("woah!");
    //             console.log(results);
    //             res.json(results);
    //         })
    // });

    // app.get('/api/test/getmanytomany', function (req, res) {
    //     db.User.findOne({ where: { admin: true } })
    //         .then(function (results) {
    //             console.log(results.get({ plain: true }));
    //             var admin = results;
    //             return admin.getBands(); // Note to self: return a promise for sane-then-chains
    //         })
    //         .then(function (results) {
    //             console.log("Admin got with better nesting: ");
    //             // console.log(results);
    //             res.json(results);
    //         })

    // });

};
