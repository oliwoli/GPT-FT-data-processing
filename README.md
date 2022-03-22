# GPT-3 Fine tuning data processing

Still in very early stages.

## Usage

````
npm run proc
npm run proc-f
```` 
To process all textfiles. The script makes a new file called `processed_(filename)` in the *"++PROCESSED"* folder. After that it will create a single merged file of all the jsonl files in the processed folder. 

You can also run `node text_to_jsonL.js` or `node mergeFiles.js` to do these steps individually.

`npm run proc-f` will DELETE all data in the *++DATA* folder, download all text-data from gdrive, process them into jsonl files and create a merged file.

````
py gdrive_download.py
py gdrive_download.py force
````
To download files from drive run either of these commands.
The first command will download without replacing existing files, while adding `force` will actually `!!DELETE!!` all files in the *++DATA* directory, therefore ensuring the data is the same locally as on gdrive.



