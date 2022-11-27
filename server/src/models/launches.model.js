const launchesDb = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;
const launch = {
    flightNumber: 100,
    mission: 'Kepler Exploration X',
    rocket: 'Explorer IS1',
    launchDate: new Date('December 27, 2030'),
    target: 'Kepler-442 b',
    customers: ['NASA', "ISRO"],
    upcoming: true,
    success: true,
}
saveLaunch(launch);

async function existsLaunchWithId(launchId) {
    return await launchesDb.findOne({flightNumber: launchId})
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDb.findOne().sort('-flightNumber') // - gives you in desc order.
    if (!latestLaunch) return DEFAULT_FLIGHT_NUMBER;
    return latestLaunch.flightNumber;
}

async function getAllLaunches() {
    return await launchesDb.find({}, {'_id': 0, '__v': 0});
}

async function saveLaunch(launch) {
    const planet = await planets.findOne({keplerName: launch.target});
    if (!planet) {
        throw new Error('No Matching planet found')
    }
    await launchesDb.updateOne(
        {flightNumber: launch.flightNumber},
        launch,
        {upsert: true}
    )
}

async function scheduleNewLaunch(launch) {
    const flightNumber = await getLatestFlightNumber() + 1;
    const newLaunch = {...launch, success: true, upcoming: true, customers: ['ISRO', 'NASA'], flightNumber};
    await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
    const aborted = await launchesDb.updateOne(
        {flightNumber: launchId},
        {upcoming: false, success: false}
    )
    // we don't really have to upsert here,
    // because we already know the document must exist.
    // upsert will insert if it's not being updated.
    return aborted.modifiedCount === 1;
}

module.exports = {getAllLaunches, scheduleNewLaunch, existsLaunchWithId, abortLaunchById}