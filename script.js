import * as fs from 'fs/promises'
import fetch from 'node-fetch'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

const FILES = [
  { id: 'allegations', url: 'https://data.cityofnewyork.us/api/views/6xgr-kwjq/rows.csv?accessType=DOWNLOAD' },
  { id: 'complaints',  url: 'https://data.cityofnewyork.us/api/views/2mby-ccnw/rows.csv?accessType=DOWNLOAD' },
  { id: 'officers',    url: 'https://data.cityofnewyork.us/api/views/2fir-qns4/rows.csv?accessType=DOWNLOAD' },
  { id: 'penalties',   url: 'https://data.cityofnewyork.us/api/views/keep-pkmh/rows.csv?accessType=DOWNLOAD' },
]

async function start() {
  for (const file of FILES) {
    console.log(file.id)

    const response = await fetch(file.url)
    const csv = await response.text()

    let records = parse(csv, { columns: true, cast: true })

    // strip date to allow useful diffs
    records = records.map(record => {
      delete record['As Of Date']
      return record
    })

    records.sort((a,b) => {
      const FIELDS = [
        'Allegation Record Identity',
        'Complaint Id',
        'Randomized Officer Id',
        'Complaint Officer Number'
      ]
      for (const field of FIELDS) {
        if (a[field] > b[field]) { return 1 }
        if (a[field] < b[field]) { return -1 }
      }
    })

    await fs.writeFile(`ccrb-complaints-database-${file.id}.csv`, stringify(records, { header: true }))
  }
}

start()
