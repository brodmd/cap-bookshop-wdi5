const { Octane, OctaneVanilla, Query } = require("@microfocus/alm-octane-js-rest-sdk")
const fs = require("fs")
const { convertJUnitXMLToOctaneXML } = require("@microfocus/alm-octane-test-result-convertion")
var xml2js = require('xml2js')


function addTestCaseInfosOctaneXml(testResultOctaneXml) {
	// iterate over test runs and test results
	for (let testRunsObj of testResultOctaneXml.test_result.test_runs) {
		for (let singleTestRun of testRunsObj.test_run) {
			// add current time in ms as ID 
			//-> ID gets always higher and is distinguishable by Octane
			singleTestRun.$["external_run_id"] = Date.now()
			singleTestRun.$["class"] = "wdi5_e2e"
		}
	}
}

function transformJunitToOctaneReport(inputPath) {

	let junitXmlReport //imported report
	let octaneXmlReport // transformed report

	// simpler result obj so specific options can be easily added later
	let resultObj = {
		"test_result": {
			"test_runs": ""
		}
	}

	// read junit.xml file and convert to octane.xml format
	if (fs.existsSync(inputPath)) {
		junitXmlReport = fs.readFileSync(inputPath, "utf8");
	}

	try {
		console.log(`Transfrom [${inputPath}] into Octane XML format ...`);
		octaneXmlReport = convertJUnitXMLToOctaneXML(junitXmlReport);
	} catch (err) {
		console.log("error while transforming report")
		throw (err)
	}

	// extract testresults into "testResultObj"
	xml2js.parseString(octaneXmlReport, (err, result) => {
		// add externel_test_id for identification
		addTestCaseInfosOctaneXml(result)
		// assign testrun results to resultObj
		resultObj.test_result.test_runs = result.test_result.test_runs
	})

	// build .xml object
	let xmlBuilder = new xml2js.Builder();
	completeOctaneXmlTestresults = xmlBuilder.buildObject(resultObj)
	console.log(`Transfrom [${inputPath}] complete`)
	return completeOctaneXmlTestresults
}

function getEnvVar(environmentVariable) {
	if (environmentVariable in process.env) {
		console.log(`Success, env [${environmentVariable}] found!`);
		return process.env[environmentVariable]
	} else {
		throw Error(`Error, env [${environmentVariable}] not found!`)
	}
}

/** ##### Upload to Octane ##### */
// create octane server instance
class SoproOctane {
	static user = "OCT_API_user";
	static password = "OCT_API_password";
	static sharedSpace = "OCT_SHARED_SPACE";

	constructor(sharedSpace) {
		this.server = new Octane({
			server: "https://almoctane-eur.saas.microfocus.com",
			sharedSpace: getEnvVar(this.sharedSpace),
			workspace: sharedSpace,
			user: getEnvVar(this.user),
			password: getEnvVar(this.password)
			,
			headers: {
				ALM_OCTANE_TECH_PREVIEW: true,
			},
		});
	}

	async checkServerConnection() {
		try {
			await this.server.authenticate();
		} catch (err) {
			console.error("Connection Error with server: \n", err); // TypeError: failed to fetch
		}
	}

	async checkAutoTestExists(testName) {
		let automatedTests = await this.server
			.get(Octane.entityTypes.tests) //get all tests
			.query(Query.field("subtype").equal("test_automated").build()) //query all automated tests
			.fields("name")
			.execute();

		let automationTestNames = Object.values(automatedTests.data);

		for (let testCase of automationTestNames) {
			if (testCase.name === testName) return true;
		}
		return false;
	}
}

async function uploadWdi5ResultsToOctane(worskpaceID) {

	if (typeof worskpaceID === 'undefined') {
		throw Error("Error no workspace ID entered")
	}

	let octaneConn = new SoproOctane(worskpaceID);
	let octaneReportPath = "./test_reports/junit/test-results.xml"
	let testReport = transformJunitToOctaneReport(octaneReportPath)
	console.log("start upload test results")
	try {
		await octaneConn.server.executeCustomRequest(
			`/api/shared_spaces/${SoproOctane.octaneSharedSpace}/${worskpaceID}/test-results`,
			Octane.operationTypes.create,
			testReport
			,
			{ ALM_OCTANE_TECH_PREVIEW: true, "Content-type": "application/xml" }
		).then((response) => { console.log(`upload complete, response: ${JSON.stringify(response)}`) });
	} catch (err) {
		console.log(
			"error occured when uploading testresults, Error:\n",
			err.message
		);
		throw err
	}
}

module.exports = { uploadWdi5ResultsToOctane }

