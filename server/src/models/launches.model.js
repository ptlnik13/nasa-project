const axios = require('axios');
const launchesDb = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;
const launch = {
    flightNumber: 100, // API REQUEST flight_number
    mission: 'Kepler Exploration X', // API REQUEST name
    rocket: 'Explorer IS1', // API REQUEST rocket.name
    launchDate: new Date('December 27, 2030'), // API REQUEST date_local
    target: 'Kepler-442 b', // API REQUEST not applicable
    customers: ['NASA', "ISRO"], // API REQUEST payloads.customers for each payload
    upcoming: true, // API REQUEST upcoming
    success: true, // API REQUEST success
}
saveLaunch(launch);
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';


async function loadLaunchData() {
    console.log('Downloading Function Data');
    const response =await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            populate: [{
                path: 'rocket',
                select: {name: 1}
            }, {
                path: 'payloads',
                select: {customers: 1}
            }]
        }
    });
    const launchDocs = response.data.docs;

    launchDocs?.forEach(launchDoc => {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => payload['customers']);
        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: new Date(launchDoc['date_local']),
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
        }
        console.log(`${launch.flightNumber} ${launch.mission}`)
    })
}

async function existsLaunchWithId(launchId) {
    return launchesDb.findOne({flightNumber: launchId});
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

module.exports = {getAllLaunches, scheduleNewLaunch, existsLaunchWithId, abortLaunchById, loadLaunchData}