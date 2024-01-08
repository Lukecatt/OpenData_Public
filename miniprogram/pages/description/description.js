const app = getApp();

Page({
    data: {
        name: "",
        address: "",
        imagePath: "",
        type: "",
        typeImage: "",
        links: []
    },
    onLoad(options){
        var sites = app.globalData.sites[options.type + "s"];
        this.location = sites[options.id - sites[0].id];
        if (app.globalData.siteImagePaths[this.location.id] == undefined){
            wx.cloud.downloadFile({
                fileID: "cloud://prod-9g54azhdd40c020a.7072-prod-9g54azhdd40c020a-1313116713/" + this.location.imagePath,
                success: res => {
                    this.setData({
                        imagePath: res.tempFilePath
                    })
                }
            })
        }
        else{
            this.setData({
                imagePath: app.globalData.siteImagePaths[this.location.id]
            })
        }
        this.setData({
            name: this.location.name,
            oldName: this.location.oldName,
            address: this.location.address,
            type: app.globalData.typeTranslation[this.location.type],
            typeImage: "../../images/"+this.location.type+".png",
            title: this.location.title,
            titleImage: "../../images/" + this.location.title + ".svg",
            description: this.location.description
        })
    },
    copyLink(event){
        wx.setClipboardData({data: this.location.links[event.currentTarget.id]})
    }
})
