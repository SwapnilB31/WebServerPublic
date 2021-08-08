window.addEventListener("load", () => {
	//showAllADUsers()
});

function dataFetch(dataObj, callback) {
	var args = arguments;
	var method = dataObj.method;
	var url = dataObj.url;
	var params = dataObj.params;
	var data = new FormData();
	if (method == "GET" || method == "get") {
		url += "?";
		for (var key in params) url += `${key}=${encodeURI(params[key])}&`;
	} else if (method == "POST" || method == "post") {
		for (var key in params) data.append(key, params[key]);
	}
	var async = dataObj.async;

	var xhr = new XMLHttpRequest();
	xhr.open(method, url, async);

	xhr.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			var res = JSON.parse(this.responseText);
			destroyLoader();

			if (args.length == 2) callback(res);
			else callback(res, args[2]);
		}
	};

	xhr.onerror = function () {
		destroyLoader();
		alert("Something went wrong!");
	};

	if (method == "POST" || method == "post") {
		createLoader();
		xhr.send(data);
	} else if (method == "GET" || method == "get") {
		createLoader();
		xhr.send();
	}
}

function hideAll(exception) {
	var boxes = ["box1", "box2", "box3", "box4"];
	for (var i in boxes)
		if (boxes[i] != exception)
			document.getElementById(boxes[i]).style.display = "none";
		else document.getElementById(boxes[i]).style.display = "block";
}

function show(panel) {
	switch (panel) {
		case "ADUser":
			hideAll("box1");
			showAllADUsers();
			break;
		case "ADAdmin":
			hideAll("box2");
			showAllADAdmins();
			break;
		case "Statistics":
			showStats();
			break;
		case "Randomize Fields":
			hideAll("box4");
			break;
	}
}

function showAllADUsers() {
	var dataObj = {
		method: "GET",
		url: "getADUsers",
		params: {},
		async: true,
	};

	dataFetch(dataObj, function (data) {
		var html = `
        <table id="adusers-table" class ='table table-striped table-hover'>
            <thead>
                <tr>
                    <th>Enabled</th>
                    <th>GivenName</th>
                    <th>Name</th>
                    <th>objectClass</th>
                    <th>objectGUID</th>
                    <th>SamAccountName</th>
                    <th>SID</th>
                    <th>Surname</th>
                    <th>UserPrincipalName</th>
                    <th>Password Expiry</th>
                    <th>Last Login</th>
                    <th/>
                </tr>
            </thead>
            <tbody>
        `;
		for (var i = 0; i < data.length; i++) {
			html += `<tr><td>${data[i][0] == 1 ? "Yes" : "No"}</td>`;
			for (var j = 1; j < data[i].length; j++) html += `<td>${data[i][j]}</td>`;
			html += `<td><button class='btn btn-primary' onclick='showPermissions("${data[i][2]}")'><i class='fa fa-eye'></i> Permissions</button></td>`;
			html += `</tr>`;
		}

		html += `</tbody></table>`;
		document.getElementById("all-ad-users").innerHTML = html;
		$("#adusers-table").ready(function () {
			$("#adusers-table").DataTable();
		});
	});
}

function filterUsersByPasswordExpiry(checkbox) {
	let expired = checkbox.checked;
	let table = document.getElementById("adusers-table");
	let rows = table.getElementsByTagName("tr");
	let today = new Date();
	for (let i = 1; i < rows.length; i++) {
		let datestr = rows[i].getElementsByTagName("td")[9].innerHTML;
		let dateObj = new Date(datestr);

		if (expired) {
			if (dateObj < today) rows[i].style.display = "none";
			else rows[i].style.display = "table-row";
		} else {
			if (dateObj >= today) rows[i].style.display = "none";
			else rows[i].style.display = "table-row";
		}
	}
}

function showAllADAdmins() {
	var dataObj = {
		method: "GET",
		url: "getADAdminMemberships",
		params: {},
		async: true,
	};
	dataFetch(dataObj, function (data) {
		var html = `
        <table id="adadmins-table" class ='table table-striped table-hover'>
            <thead>
                <tr>
                    <th>GroupCategory</th>
                    <th>GroupScope</th>
                    <th>Name</th>
                    <th>objectClass</th>
                    <th>objectGUID</th>
                    <th>SamAccountName</th>
                    <th>SID</th>
                </tr>
            </thead>
            <tbody>
        `;
		for (var i = 0; i < data.length; i++) {
			html += `<tr><td>${data[i][0] == 1 ? "Yes" : "No"}</td>`;
			for (var j = 1; j < data[i].length; j++) html += `<td>${data[i][j]}</td>`;
			html += `</tr>`;
		}

		html += `</tbody></table>`;
		console.log(html);
		document.getElementById("all-ad-admins").innerHTML = html;

		$("#adadmins-table").ready(function () {
			$("#adadmins-table").DataTable();
		});
	});
}

function fetchData() {
	var dataObj = {
		method: "GET",
		url: "fetchFromWinServer",
		params: {},
		async: true,
	};
	dataFetch(dataObj, function (data) {
		if (data["fetch"] == true) alert("New data fetched successfully!");
		else alert("Something went wrong!");
	});
}

function randomizeFields(param) {
	var dataObj = {
		method: "GET",
		params: {},
		async: true,
	};
	if (param == "LastLogin") dataObj["url"] = "randomizeLastLog";
	else if (param == "PasswordExpiry") dataObj["url"] = "randomizePassExp";
	dataFetch(dataObj, function (data) {
		if (data["post"])
			alert(
				`Successfully filled Random values for the field '${param}' on all accounts`
			);
		else alert("Something went wrong!");
	});
}

function showStats() {
	stats();
	hideAll("box3");
}

function showPermissions(name) {
	const modal = document.querySelector(".custom-modal");

	createLoader();
	fetch(`/getPermissions/${encodeURI(name)}`)
		.then((res) => res.json())
		.then((permissions) => {
			destroyLoader();
			if (permissions.length == 0) {
				document.getElementById(
					"user-name-permission"
				).innerHTML = `<strong>${name}</strong>`;
				document.getElementById(
					"permissions-div"
				).innerHTML = `<strong><span style='color : crimson'>Access Denied! Couldn't fetch permissions for user ${name}</span></strong>`;
				modal.style.display = "block";
				return;
			}
			let html = `
        <table class='table table-striped table-hover' id='permissions-table'>
            <thead>
                <tr>
                    <th>ActiveDirectoryRights</th>
                    <th>InheritanceType</th>
                    <th>ObjectType</th>
                    <th>InheritedObjectType</th>
                    <th>ObjectFlags</th>
                    <th>AccessControlType</th>
                    <th>IdentityReference</th>
                    <th>IsInherited</th>
                    <th>InheritanceFlags</th>
                    <th>PropagationFlags</th>
                </tr>
            </thead>
            <tbody>
        `;
			for (let i = 0; i < permissions.length; i++) {
				let currObj = permissions[i];
				html += `
                <tr>
                    <td>${currObj.ActiveDirectoryRights}</td>
                    <td>${currObj.InheritanceType}</td>
                    <td>${currObj.ObjectType}</td>
                    <td>${currObj.InheritedObjectType}</td>
                    <td>${currObj.ObjectFlags}</td>
                    <td>${currObj.AccessControlType}</td>
                    <td>${currObj.IdentityReference}</td>
                    <td>${currObj.IsInherited}</td>
                    <td>${currObj.InheritanceFlags}</td>
                    <td>${currObj.PropagationFlags}</td>
                </tr>
            `;
			}
			html += `
            </tbody>
        </table>
        `;
			document.getElementById(
				"user-name-permission"
			).innerHTML = `<strong>${name}</strong>`;
			document.getElementById("permissions-div").innerHTML = html;
			modal.style.display = "block";
		})
		.catch((err) => {
			console.warn(err);
			destroyLoader();
			alert("Something went wrong :" + err.message);
		});
}

function stats() {
	var dataObj = {
		method: "GET",
		url: "statsSummary",
		params: {},
		async: true,
	};
	dataFetch(dataObj, function (data) {
		let html = `
        <table class='table table-striped table-hover'>
            <tr>
                <th>Average Group Membership</th>
                <td id='avg_group_membership'>calculating...</td>
            </tr>
            <tr>
                <th>Vulnerability Index</th>
                <td id='vulnerability_index'>calculating...</td>
            </tr>
            <tr>
                <th>Maximum Degree of Nesting</th>
                <td id='max_degree_nesting'>calculating...</td>
            </tr>
            <tr>
                <th>Number of Accounts with expired password</th>
                <td>${data.num_expired} / ${data.num_users}</td>
            </tr>
            <tr>
                <th>Number of users that logged in during the last week</th>
                <td>${data.login_count} / ${data.num_users}</td>
            </tr>
            <tr>
                <th>Number of users that logged in during the last 30 days</th>
                <td>${data.login_count_30} / ${data.num_users}</td>
            </tr>
        </table>
        `;
		document.getElementById("aduser-stats").innerHTML = html;
		createLoader();
		fetch("/getNestingInfo")
			.then((res) => res.json())
			.then((data) => {
				destroyLoader();
				avg_group_membership = parseInt(data.total) / parseInt(data.num_groups);
				vulnerability_index = parseInt(data.num_groups) / avg_group_membership;

				document.getElementById("avg_group_membership").innerText =
					avg_group_membership;
				document.getElementById("vulnerability_index").innerText =
					vulnerability_index;
				document.getElementById("max_degree_nesting").innerText = data.max;
				//max_degree_nesting
			})
			.catch((err) => {
				destroyLoader();
			});
		drawPieChart(data);
	});
}

/** Draw Pi Charts */

function drawPieChart(data) {
	/**
	 * Draw The first chart of User Login Data
	 */

	document.getElementById("pieChart1").innerHTML = "";
	document.getElementById("pieChart1").setAttribute("style", "height:250px");
	document.getElementById("pieChart1").removeAttribute("height");
	document.getElementById("pieChart1").removeAttribute("width");

	document.getElementById("pieChart2").innerHTML = "";
	document.getElementById("pieChart2").setAttribute("style", "height:250px");
	document.getElementById("pieChart2").removeAttribute("height");
	document.getElementById("pieChart2").removeAttribute("width");

	document.getElementById("pieChart3").innerHTML = "";
	document.getElementById("pieChart3").setAttribute("style", "height:250px");
	document.getElementById("pieChart3").removeAttribute("height");
	document.getElementById("pieChart3").removeAttribute("width");

	var pieChartCanvas1 = $("#pieChart1").get(0).getContext("2d");
	var pieChart1 = new Chart(pieChartCanvas1);

	var PieData1 = [
		{
			value: data.login_count,
			color: "#00a65a",
			highlight: "#00a65a",
			label: "Logged in During the last 7 days",
		},
		{
			value: data.num_users - data.login_count,
			color: "#f56954",
			highlight: "#f56954",
			label: `Didn't Logged in During the last 7 days`,
		},
	];

	var pieOptions = {
		//Boolean - Whether we should show a stroke on each segment
		segmentShowStroke: true,
		//String - The colour of each segment stroke
		segmentStrokeColor: "#fff",
		//Number - The width of each segment stroke
		segmentStrokeWidth: 2,
		//Number - The percentage of the chart that we cut out of the middle
		percentageInnerCutout: 50, // This is 0 for Pie charts
		//Number - Amount of animation steps
		animationSteps: 100,
		//String - Animation easing effect
		animationEasing: "easeOutBounce",
		//Boolean - Whether we animate the rotation of the Doughnut
		animateRotate: true,
		//Boolean - Whether we animate scaling the Doughnut from the centre
		animateScale: false,
		//Boolean - whether to make the chart responsive to window resizing
		responsive: true,
		// Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
		maintainAspectRatio: true,
		//String - A legend template
		legendTemplate:
			'<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>',
	};

	pieChart1.Doughnut(PieData1, pieOptions);

	/**
	 * Draw The second chart of Password Expiry Data
	 */

	pieChartCanvas1 = $("#pieChart2").get(0).getContext("2d");
	pieChart1 = new Chart(pieChartCanvas1);

	PieData1 = [
		{
			value: data.num_expired,
			color: "#f56954",
			highlight: "#f56954",
			label: "Users with Expired Passwords",
		},
		{
			value: data.num_users - data.num_expired,
			color: "#00a65a",
			highlight: "#00a65a",
			label: "Users with valid Passwords",
		},
	];

	pieChart1.Doughnut(PieData1, pieOptions);

	pieChartCanvas2 = $("#pieChart3").get(0).getContext("2d");
	pieChart2 = new Chart(pieChartCanvas2);

	PieData2 = [
		{
			value: 4,
			color: "#f56954",
			highlight: "#f56954",
			label: "Non Standard Users",
		},
		{
			value: 18,
			color: "#00a65a",
			highlight: "#00a65a",
			label: "Standard Users",
		},
	];

	pieChart2.Doughnut(PieData2, pieOptions);
}

/** UI Utility Functions */
function closeModal(button) {
	var modal = button.parentElement.parentElement.parentElement.parentElement;
	modal.setAttribute("class", "modal fade");
	modal.style.display = "none";
	var errors = document.getElementsByClassName("err");
	for (var i in errors) errors[i].innerHTML = "";
}
