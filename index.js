"use strict";
let queue = [];
let knownUsers = {};
let loadedUsers = {};
let status = {};

function getID(id) { return document.getElementById(id); }

function countValue(o, v) {
	let count = 0;
	for(let k in o) {
		if(o[k]==v) { ++count; }
	}
	return count;
}

function userCount() { return countValue(status, "found"); }
function fetching() { return countValue(status, "fetching"); }

function add(parent, e, vars) {
	let t = document.createElement(e);
	for(let k in vars) {
		t[k] = vars[k];
	}
	parent.appendChild(t);
	return t;
}

function addUser(url, portal) {
	if(loadedUsers[url]) { return; }
	loadedUsers[url] = portal;
	let li = document.createElement('li');
	let a = add(li, 'a', {href:url});
	let img = add(a, 'img', {alt:portal.name});
	
	let imgbase = url;
	img.src = `${imgbase}media/content/icon.svg`;
	add(a, 'br');
	a.innerHTML += '@'+portal.name;	
	
	getID("userlist").appendChild(li);
	status[url] = "found";
	getID("user-count").innerHTML = userCount();
	getID("fetch-count").innerHTML = fetching();
}

async function cleanURL(url) {
	url = url.trim();
	while(url[url.length-1] == '/') {
		url = url.slice(0, -1);
	}
	return 'dat://'+(await DatArchive.resolveName(url)) + '/';
}

async function loadSite(url) {
	if(loadedUsers[url]) return;
	try {
		status[url] = "fetching";
		getID("fetch-count").innerHTML = fetching();
		let archive = new DatArchive(url);
		let data = await archive.readFile('/portal.json');
		let portal = JSON.parse(data);
		addUser(url, portal);
		for(let i=0; i<portal.port.length; ++i) {
			let p = await cleanURL(portal.port[i]);
			if(!knownUsers[p]) {
				knownUsers[p] = true;
				queue.push(p);
			}
		}
	} catch(err) {
		console.log(err);
		status[url] = "error";
		getID("fetch-count").innerHTML = fetching();
	}
}

function tick() {
	while(queue.length > 0) {
		let url = queue.shift();
		loadSite(url);
	}
	requestAnimationFrame(tick);
}

async function main() {
	getID("discover-form").onsubmit = async (e)=>{
		e.preventDefault();
		queue = [];
		knownUsers = [];
		loadedUsers = [];
		status = {};
		getID("user-count").innerHTML = '0';
		getID("userlist").innerHTML = '';
		let url = await cleanURL(getID("root-url").value);
		queue.push(url);
	};
	tick();
}

main()
