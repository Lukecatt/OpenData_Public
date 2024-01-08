const sites = require("../../sites.js");

const app = getApp();
app.globalData.siteImagePaths = {};
app.globalData.typeTranslation = {
    "destroyed": "历史地点旧址",
    "partial": "部分保存的历史地点",
    "preserved": "现存历史地点",
    "settlement": "居住点",
    "road": "道路"
}
app.globalData.sites = {};

const boundary = {  // coordinates for limiting map to Shanghai
    southwest: {
        longitude: 120.9798001191406,
        latitude: 30.250963654463118
    },
    northeast: {
        longitude: 122.08117951367186,
        latitude: 31.67026825549656
    }
}

Page({
    data: {
        siteMarkers: [],
        roads: [],
        settlements: [],
        scale: 10.2,
        calloutVisible: true,
        descImage: "",
        descImageVisible: false,
        descName: "",
        descTypeImage: "",
        descType: "",
        descCardShow: false,
        siteButton: true,
        settButton: true,
        roadButton: true,
        mapOn: true,
        searchOn: false,
    },
    siteMarkers: [],   // for storing sites, settlements, and roads for filter turning on and off
    settlements: {
        markers: [],
        polygons: []
    },
    roads: {
        markers: [],
        polylines: []
    },
    createMarker(object){ // id: integer, name: string, longitude and latitude: float, status: string (preserved, partial, or destroyed)
        let marker = {                      
            id: object.id,
            width: 25,
            height: 25,
            longitude: object.longitude,
            latitude: object.latitude,
            iconPath: "",
            type: object.status,
            name: object.name,
            customCallout: {
                anchorY: 0,
                display: "ALWAYS",
            }
        }
        if (object.status == "road"){
            marker.iconPath = "../../images/road.png";
        }
        else if (object.status == "settlement"){
            marker.iconPath = "../../images/settlement.png";
        }
        else{
            marker.iconPath = "../../images/"+object.status+".png";
        }
        return marker;
    },
    addRoad(object){
        let newMarker = this.createMarker({
            id: object.id,
            name: object.name,
            longitude: object.markerLocation.longitude,
            latitude: object.markerLocation.latitude,
            status: "road"
        })
        let road = {
            points: object.points,
            color: "#074188",
            width: 3,
        }
        return [road, newMarker];
    },
    addSettlement(object){
        let newMarker = this.createMarker({
            id: object.id,
            name: object.name,
            longitude: object.markerLocation.longitude,
            latitude: object.markerLocation.latitude,
            status: "settlement"
        })
        let settlement = {
            points: object.points,
            strokeWidth: 2,
            strokeColor: "#aa7952",
            fillColor: "#f7b07880"
        }
        return [settlement, newMarker]
    },
    mapElementInit(){
        this.sites = sites.getSites();
        app.globalData.sites = this.sites;
        let roadMarkers = [];
        let settlementMarkers = [];
        let sitesTemp = this.sites.sites.map(item => {
            let newMarker = this.createMarker(item);
            this.siteMarkers.push(newMarker);
            return newMarker;
        })
        this.setData({
            siteMarkers: sitesTemp, // adding markers for sites
            roads: this.sites.roads.map(item => { // adding polylines for roads
                let returnValue = this.addRoad(item);
                roadMarkers.push(returnValue[1]);
                this.roads.markers.push(returnValue[1]);
                this.roads.polylines.push(returnValue[0]);
                return returnValue[0];
                }),
            settlements: this.sites.settlements.map(item => {
                let returnValue = this.addSettlement(item);
                settlementMarkers.push(returnValue[1]);
                this.settlements.markers.push(returnValue[1]);
                        this.settlements.polygons.push(returnValue[0]);
                        return returnValue[0]
                    })
                });
        let currentMarkers = this.data.siteMarkers; // adding markers for roads
        for (let i=0; i<roadMarkers.length; i++){
            currentMarkers.push(roadMarkers[i]);
        }
        for (let i=0; i<settlementMarkers.length; i++){
            currentMarkers.push(settlementMarkers[i]);
        }
        this.setData({siteMarkers: currentMarkers}); 
    },
    onLoad(){
        this.mapElementInit();
        this.map = wx.createMapContext("map");
        this.map.setBoundary(boundary);
        const platform = wx.getDeviceInfo().platform;
        if (platform == "android" || platform == "ios"){   // on PC and devtools, labels are always shown
            this.setData({calloutVisible: false, scale: 10.2 })
        }
    },
    displayCallout(){
        this.map.getScale({success: res => {
            if (res.scale >= 10.7){
                this.setData({calloutVisible: true});
            }
            else{
                this.setData({calloutVisible: false});
            }
        }})
    },
    searchLocation(id){  // uses id, returns all information about a site,settlement,or road
        for (let marker of this.data.siteMarkers){
            if (id == marker.id){
                if (marker.type == "road"){
                    let location = this.sites.roads[id-this.sites.roads[0].id];
                    location.type = "road";
                    return location;
                }
                else if (marker.type == "settlement"){
                    let location = this.sites.settlements[id-this.sites.settlements[0].id];
                    location.type = "settlement";
                    return location;
                }
                else{
                    let location = this.sites.sites[id-1];
                    location.type = location.status;
                    return location;
                }
            }
        }
    },
    descDisplay(event){  // display description page 
        if (!this.data.descCardShow){
            let location = this.searchLocation(event.detail.markerId);
            this.location = location;
            if (location.type == "settlement" || location.type=="road"){
                var markerLongitude = location.markerLocation.longitude;
                var markerLatitude = location.markerLocation.latitude;
            }
            else{
                var markerLongitude = location.longitude;
                var markerLatitude = location.latitude;
            }
            this.map.moveToLocation({
                longitude: markerLongitude,
                latitude: markerLatitude,
                success: () => {
                    this.setData({
                        descCardShow: true,
                        descName: location.name,
                        descType: app.globalData.typeTranslation[location.type],
                        descTypeImage: "../../images/"+location.type+".png",
                        descTitle: location.title,
                        descTitleImage: "../../images/" + location.title + ".svg"
                    })
                }
            })
            if (app.globalData.siteImagePaths[event.detail.markerId] == undefined){
                console.log(location.imagePath)
                this.imageDownloadTask = wx.cloud.downloadFile({
                    fileID: "cloud://prod-9g54azhdd40c020a.7072-prod-9g54azhdd40c020a-1313116713/" + location.imagePath[0],
                    success: res => {
                        this.setData({
                            descImageVisible: true,
                            descImage: res.tempFilePath
                        })
                        app.globalData.siteImagePaths[event.detail.markerId] = res.tempFilePath
                    }
                })
            }
            else{
                this.setData({
                    descImageVisible: true,
                    descImage: app.globalData.siteImagePaths[event.detail.markerId]
                })
            }
        }
    },
    descClose(){
        this.setData({
            descImage: "",
            descCardShow: false,
        })
        this.imageDownloadTask.abort();  // aborts image download if has not loaded
        setTimeout(()=>this.setData({descImageVisible:false}), 500);
    },
    redirDescPage(){  // goes to description page
        let url = "../description/description?id=" + this.location.id + "&type=";
        if (this.location.type == "settlement" || this.location.type == "road"){
            url = url + this.location.type;
        }
        else {
            url = url + "site";
        }
        wx.navigateTo({
            url: url
        })
    },
    removeMarkers(markers){ // removes markers from siteMarkers on map for given list of consecutive markers
        let targetList = this.data.siteMarkers;
        for (let i=0; i<targetList.length; i++){
            if (targetList[i].id == markers[0].id){
                targetList.splice(i, markers.length);
            }
        }
        return targetList;
    },
    addMarkers(markers){
        let targetList = this.data.siteMarkers;
        for (let m of markers){
            targetList.splice(m.id-1, 0, m);
        }
        return targetList;
    },
    filterSite(){
        if (this.data.siteButton){
            this.setData({
                siteMarkers: this.removeMarkers(this.siteMarkers)
            })
        }
        else{
            this.setData({
                siteMarkers: this.addMarkers(this.siteMarkers)
            })
        }
        this.setData({siteButton: !this.data.siteButton});
    },
    filterSett(){
        if (this.data.settButton){
            this.setData({
                settlements: [],
                siteMarkers: this.removeMarkers(this.settlements.markers)
            })
        }
        else{
            this.setData({
                settlements: this.settlements.polygons,
                siteMarkers: this.addMarkers(this.settlements.markers)
            })
        }
        this.setData({settButton: !this.data.settButton});
    },
    filterRoad(){
        if (this.data.roadButton){
            this.setData({
                roads: [],
                siteMarkers: this.removeMarkers(this.roads.markers)
            })
        }
        else{
            this.setData({
                roads: this.roads.polylines,
                siteMarkers: this.addMarkers(this.roads.markers)
            })
        }
        this.setData({roadButton: !this.data.roadButton});
    },
    switchMap(){
        this.setData({
            mapOn: true,
            searchOn: false
        })
    },
    switchSearch(){
        this.setData({
            mapOn: false,
            searchOn: true
        })
    },
})