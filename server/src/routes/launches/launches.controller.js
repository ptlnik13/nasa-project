const {scheduleNewLaunch, getAllLaunches, existsLaunchWithId, abortLaunchById} = require('../../models/launches.model');
const {getPagination} = require("../../services/query");

async function httpGetAllLaunches(req, res) {
    // console.log(req.query) // In PHP $_GET[]
    const {skip, limit} = getPagination(req.query);
    const launches = await getAllLaunches(skip, limit);
    return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
    const newLaunch = req.body;
    if (!newLaunch.mission || !newLaunch.rocket || !newLaunch.launchDate || !newLaunch.target) {
        return res.status(400).json({error: 'Missing required launch properties'});
    }
    newLaunch.launchDate = new Date(newLaunch.launchDate);
    if (isNaN(newLaunch.launchDate)) return res.status(400).json({error: 'Date should be valid'})
    await scheduleNewLaunch(newLaunch);
    return res.status(201).json(newLaunch);
}

async function httpAbortLaunch(req, res) {
    const launchId = Number(req.params.id);
    const existsLaunch = await existsLaunchWithId(launchId);
    if (!existsLaunch) {
        return res.status(404).json({error: 'Launch did not found'});
    }
    const aborted = await abortLaunchById(launchId);
    if (!aborted) return res.status(400).json({error: 'Launch not aborted'});
    return res.status(200).json({ok: true});
}

module.exports = {httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch}