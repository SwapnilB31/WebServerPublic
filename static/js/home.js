function dataFetch(dataObj,callback) {
    var args = arguments;
    var method = dataObj.method;
    var url = dataObj.url;
    var params = dataObj.params;
    var data = new FormData();
    if(method == "GET" || method == "get") {
        url += "?";
        for(var key in params)
            url += `${key}=${encodeURI(params[key])}&`;
    }
    else if(method == "POST" || method == "post") {
        for(var key in params) 
            data.append(key,params[key]);
    }
    var async = dataObj.async;

    var xhr = new XMLHttpRequest();
    xhr.open(method,url,async);

    xhr.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(this.responseText);
            destroyLoader();
            
            if(args.length == 2)
                callback(res);
            else    
                callback(res,args[2]);
        }
    };

    xhr.onerror = function() {
        destroyLoader();
        alert("Something went wrong! Please make sure that you are connected NITT Wifi/Intranet and try again!");
    };

    if(method == "POST" || method == "post") {
        createLoader();
        xhr.send(data);
    }
    else if(method == "GET" || method == "get") {
        createLoader();
        xhr.send();
    }
}

function hideAll(exception) {
    var boxes = ["box1","box2","box3","box4"];
    for(var i in boxes)
        if(boxes[i] != exception)
            document.getElementById(boxes[i]).style.display = 'none';
        else
            document.getElementById(boxes[i]).style.display = 'block';
}

function show(panel) {
    switch(panel) {
        case "ADUser":
            hideAll("box1");
            break;
        case "ADAdmin":
            hideAll("box2");
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
    stats();
    var dataObj = {
        method : "GET",
        url : "getADUsers",
        params : {},
        async : true
    };

    dataFetch(dataObj,function(data) {
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
                </tr>
            </thead>
            <tbody>
        `;
        for(var i = 0; i < data.length; i++) {
            html += `<tr><td>${data[i][0] == 1 ? 'Yes' : 'No'}</td>`;
            for(var j = 1; j < data[i].length; j++)
                html += `<td>${data[i][j]}</td>`;
            html += `</tr>`;
        }

        html += `</tbody></table>`;
        document.getElementById("all-ad-users").innerHTML = html;
       $("#adusers-table").ready(function(){
           $("#adusers-table").DataTable();
       })
        
    });
}

function filterUsersByPasswordExpiry(checkbox) {    
    let expired = checkbox.checked;
    let table = document.getElementById("adusers-table");
    let rows = table.getElementsByTagName('tr');
    let today = new Date();
    for(let i = 1; i < rows.length; i++) {
        let datestr = rows[i].getElementsByTagName('td')[9].innerHTML;
        let dateObj = new Date(datestr);

        if(expired) {
            if(dateObj < today)
                rows[i].style.display = 'none';
            else
                rows[i].style.display = 'table-row';
        }
        else {
            if(dateObj >= today)
                rows[i].style.display = 'none';
            else
                rows[i].style.display = 'table-row';
        }
    }
}

function showAllADAdmins() {
    var dataObj = {
        method : "GET",
        url : "getADAdminMemberships",
        params : {},
        async : true
    };
    dataFetch(dataObj,function(data) {
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
        for(var i = 0; i < data.length; i++) {
            html += `<tr><td>${data[i][0] == 1 ? 'Yes' : 'No'}</td>`;
            for(var j = 1; j < data[i].length; j++)
                html += `<td>${data[i][j]}</td>`;
            html += `</tr>`;
        }

        html += `</tbody></table>`;
        console.log(html);
        document.getElementById("all-ad-admins").innerHTML = html;

        $("#adadmins-table").ready(function(){
            $("#adadmins-table").DataTable();
        })
    });
}

function fetchData() {
    var dataObj = {
        method : "GET",
        url : "fetchFromWinServer",
        params : {},
        async : true
    };
    dataFetch(dataObj,function(data){
        if(data["fetch"] == true)
            alert("New data fetched successfully!");
        else
            alert("Something went wrong!");
    })
}

function randomizeFields(param) {
    var dataObj = {
        method : "GET",
        params : {},
        async : true
    };
    if(param == "LastLogin")
        dataObj["url"] = "randomizeLastLog";
    else if(param == "PasswordExpiry")
        dataObj["url"] = "randomizePassExp";
    dataFetch(dataObj,function(data){
        if(data["post"])
            alert(`Successfully filled Random values for the field '${param}' on all accounts`);
        else
            alert("Something went wrong!");
    })
}

function showStats() {
    stats();
    hideAll("box3");
}

function stats() {
    var dataObj = {
        method : "GET",
        url : "statsSummary",
        params : {},
        async : true
    }
    dataFetch(dataObj,function(data){
        let html = `
        <table class='table table-striped table-hover'>
            <tr>
                <th>Average Group Membership</th>
                <td>${data["avg_group"]}</td>
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
        drawPieChart(data);
    });
}

function drawPieChart(data) {
    /**
     * Draw The first chart of User Login Data
     */

    document.getElementById("pieChart1").innerHTML = "";
    document.getElementById("pieChart1").setAttribute("style","height:250px");
    document.getElementById("pieChart1").removeAttribute("height");
    document.getElementById("pieChart1").removeAttribute("width");


    document.getElementById("pieChart2").innerHTML = "";
    document.getElementById("pieChart2").setAttribute("style","height:250px");
    document.getElementById("pieChart2").removeAttribute("height");
    document.getElementById("pieChart2").removeAttribute("width");

    var pieChartCanvas1 = $('#pieChart1').get(0).getContext('2d');
    var pieChart1       = new Chart(pieChartCanvas1);

    var PieData1        = [
        {
          value    : data.login_count,
          color    : '#00a65a',
          highlight: '#00a65a',
          label    : 'Logged in During the last 7 days'
        },
        {
          value    : data.num_users - data.login_count,
          color    : '#f56954',
          highlight: '#f56954',
          label    : `Didn't Logged in During the last 7 days`
        }
    ];

    var pieOptions     = {
        //Boolean - Whether we should show a stroke on each segment
        segmentShowStroke    : true,
        //String - The colour of each segment stroke
        segmentStrokeColor   : '#fff',
        //Number - The width of each segment stroke
        segmentStrokeWidth   : 2,
        //Number - The percentage of the chart that we cut out of the middle
        percentageInnerCutout: 50, // This is 0 for Pie charts
        //Number - Amount of animation steps
        animationSteps       : 100,
        //String - Animation easing effect
        animationEasing      : 'easeOutBounce',
        //Boolean - Whether we animate the rotation of the Doughnut
        animateRotate        : true,
        //Boolean - Whether we animate scaling the Doughnut from the centre
        animateScale         : false,
        //Boolean - whether to make the chart responsive to window resizing
        responsive           : true,
        // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
        maintainAspectRatio  : true,
        //String - A legend template
        legendTemplate       : '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<segments.length; i++){%><li><span style="background-color:<%=segments[i].fillColor%>"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>'
    };

    pieChart1.Doughnut(PieData1, pieOptions);

    /**
     * Draw The second chart of Password Expiry Data
     */

    pieChartCanvas1 = $('#pieChart2').get(0).getContext('2d');
    pieChart1       = new Chart(pieChartCanvas1);

    PieData1        = [
        {
          value    : data.num_expired,
          color    : '#f56954',
          highlight: '#f56954',
          label    : 'Users with Expired Passwords'
        },
        {
          value    : data.num_users - data.num_expired,
          color    : '#00a65a',
          highlight: '#00a65a',
          label    : 'Users with valid Passwords'
        }
    ];

    
    pieChart1.Doughnut(PieData1, pieOptions);
}