const {parse} = require('csv-parse');
const path = require('path');
const fs = require('fs');

const planets = require('./planets.mongo');

function isHabitablePlanets(planet) {
    return planet['koi_disposition'] === 'CONFIRMED'
        && planet['koi_insol'] > 0.36
        && planet['koi_insol'] < 1.11
        && planet['koi_prad'] < 1.6;
}

function loadPlanetsData() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'kepler_data.csv'))
            .pipe(parse({
                comment: '#',
                columns: true
            }))
            .on('data', async data => {
                if (isHabitablePlanets(data)) {
                    await savePlanet(data);
                }
            })
            .on('error', error => {
                console.log(error);
                reject(error);
            })
            .on('end', async () => {
                const countPlanetsFound = (await getAllPlanets()).length;
                console.log(`${countPlanetsFound} habitable planets found!`);
                resolve();
            });
    });
}

async function getAllPlanets() {
    return await planets.find({}, {'_id': 0, '__v': 0});  //returns everything and excluding "_id" and "__v"
}

async function savePlanet(planet) {
    try {
        //Replace below create with insert + update = upsert,
        // so it won't append every time when we start server
        // await planets.create({keplerName: data.kepler_name});
        await planets.updateOne(
            {keplerName: planet.kepler_name},
            {keplerName: planet.kepler_name},
            {upsert: true}
        )
    } catch (e) {
        console.error(`Could not save planet ${e}`);
    }
}

module.exports = {loadPlanetsData, getAllPlanets};