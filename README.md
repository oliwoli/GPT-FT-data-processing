# GPT-3 Fine tuning data processing

Still in very early stages.

## Usage

````
npm run proc
```` 

To process all textfiles. The script makes a new file called `processed_(filename)` in the *"++PROCESSED"* folder. After that it will create a single merged file of all the jsonl files in the processed/merged folder. Keep in mind that the script does not yet handle csv, excel-type file types.

You can also run `node text_to_jsonL.js` or `node mergeFiles.js` to do these steps individually.

### Google drive integration
- To setup google drive, you'll firstly need to have python installed on your system.
- Using the [google cloud console](https://console.cloud.google.com/), create a new project, generate a **client secret** file for google drive and save it as **client_secrets.json** in the root directory. See [google documentation](https://developers.google.com/workspace/guides/get-started) for more info
- It's all pretty janky and takes forever but hey! It works (at least for me and my colleague)
```` 
npm run proc-f
```` 
This command will DELETE all data in the *++DATA* folder, download all text-data from gdrive, process them into jsonl files and create a merged file.

````
py gdrive-download.py
````
````
py gdrive-download.py force
````
To download files from drive run either of these commands.
The first command will download without replacing existing files, while adding `force` will actually `!!DELETE!!` all files in the *++DATA* directory, therefore ensuring the data is the same locally as on gdrive.



