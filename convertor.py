import openpyxl, json, os

wb = openpyxl.load_workbook("SSR.xlsx")

siteSheet = wb["Sites"]
settSheet = wb["Settlements"]
roadSheet = wb["Roads"]
jsonFile = {
    "sites": [],
    "roads": [],
    "settlements": []
}


statusTranslation = {
    "P": "partial",
    "S": "preserved",
    "R": "destroyed"
}

def noneToStr(arg):
    if arg == None:
        return ""
    return arg



for i in range (2, 16): # sites
    oldName = siteSheet["E" + str(i)].value
    curName = siteSheet["D" + str(i)].value
    if not oldName or not curName:
        name = noneToStr(curName) + noneToStr(oldName)
        oldDisplayName = ""
    else:
        name = curName
        oldDisplayName = "(现" + oldName + ")"
    status = siteSheet["J" + str(i)].value
    images = siteSheet["N" + str(i)].value.split(", ")
    for index in range(len(images)):
        # images[index] = "image/" + images[index]
        print(images[index])
        for root, dirs, files in os.walk("../image", topdown=False):
            for f in files:
                if (images[index] == f[0:5]):
                    images[index] = "image/" + f
    obj = {
        "id": i - 1,
        "name": name,
        "oldName": oldDisplayName,
        "address": siteSheet["F" + str(i)].value,
        "longitude": siteSheet["G" + str(i)].value,
        "latitude": siteSheet["H" + str(i)].value,
        "status": statusTranslation[status],
        "title": noneToStr(siteSheet["K" + str(i)].value),
        "otherTitle": noneToStr(siteSheet["L" + str(i)].value),
        "imagePath": images,
        "description": siteSheet["Q" + str(i)].value,
    }
    jsonFile["sites"].append(obj)


with open ("sites.json", "w") as f:
    f.write(json.dumps(jsonFile))