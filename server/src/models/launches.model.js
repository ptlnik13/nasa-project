const axios = require('axios');
const launchesDb = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading Function Data');
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [{path: 'rocket', select: {name: 1}}, {path: 'payloads', select: {customers: 1}}]
        }
    });
    if (response.status !== 200) {
        console.log('Problem Downloading Data');
        throw new Error('Launch data Download Failed');
    }
    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
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
        // console.log(`${launch.flightNumber} ${launch.mission}`)
        await saveLaunch(launch);
    }
}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({flightNumber: 1, rocket: 'Falcon 1', mission: 'FalconSat'});
    if (firstLaunch) {
        console.log('Launch data already loaded!');
    } else {
        await populateLaunches();
    }

}

async function findLaunch(filter) {
    return launchesDb.findOne(filter);
}


async function existsLaunchWithId(launchId) {
    return findLaunch({flightNumber: launchId});
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDb.findOne().sort('-flightNumber') // - gives you in desc order.
    if (!latestLaunch) return DEFAULT_FLIGHT_NUMBER;
    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
    return launchesDb
        .find({}, {'_id': 0, '__v': 0})
        .sort({flightNumber: 1})
        .skip(skip)
        .limit(limit);
}

async function saveLaunch(launch) {
    await launchesDb.updateOne(
        {flightNumber: launch.flightNumber},
        launch,
        {upsert: true}
    )
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({keplerName: launch.target});
    if (!planet) {
        throw new Error('No Matching planet found')
    }
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