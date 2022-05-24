# GPT-3 Fine tuning data processing

A tool to help prepare text data for fine tuning with OpenAI's GPT.
Splits a text into individual training examples when there are 3 empty lines between (by default).
To specify a prompt:
in your text (your training data), add ``[prompt: your prompt]`` before your wanted completion.

## Usage

````
npm run proc
```` 

To process all textfiles. The script makes a new file called `processed_(filename)` in the *"++PROCESSED"* folder. After that it will create a single merged file of all the jsonl files in the processed/merged folder. Keep in mind that the script does not yet handle csv, excel-type file types.

You can also run `node text_to_jsonL.js` or `node mergeFiles.js` to do these steps individually.

### Google drive integration
- To setup google drive, you'll firstly need to have python installed on your system.
- Using the [google cloud console](https://console.cloud.google.com/), create a new project, generate a **client secret** file for google drive and save it as **client_secrets.json** in the root directory. See [google documentation](https://developers.google.com/workspace/guides/get-started) for more info
- In the file **gdrive-download.py** edit the constants "DRIVE_ROOT" to your drive folder ID, and optionally "DL_DIR" if you want to change the directory the files get downloaded into. 
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


## Settings
The most important files are **text_to_jsonL.js** and **mergeFiles.js**.

In **text_tojsonL.js** you can change the most important parameters:

- **DATA_DIR**: The directory your data (text files) are in (default: "++DATA")
- **PROCESS_DIR**: Where you want the processed file to be saved to (default: "++PROCESSED")
- **PROCESS_PREFIX**: default is "proc_" meaning the file *book.txt* will be saved as *proc_book.jsonl*
- **CUSTOM_SEPARATOR**: First thing to split the text by (default: 3 empty lines).
- **MAX_CHARACTERS**: If a text block is bigger than the TOKENLIMIT, it will split it up by the closest SEPERATOR after this amount of characters in the text.
- **SEPERATORS**: The point at which the script will split the text (if a text chunk is > token limit). Default is [". ", "...\\n", ".\\n", "? ", "?\\n"]
- **TOKENLIMIT**: Default is 2030, because the max for GPT-3 Davinci as of now is 2000 tokens. 30 extra because it's only an approximation and it's usually less. While this worked for our dataset, you might want to change this if you want to be more careful.
- **STOP_SEQ**: Stop Sequence. To separate one example from the other. Use the same sequence when prompting the fine tuned model.
- **logGoodFiles**: Default set to true. If there was no additional separating after the custom separator, log the file as *passed* in the console.
- **skipCertainFiles**: Default true. Skips files which are named with a certain prefix.
- **skipFilePrefix**: The prefix for the files that should be ignored by the script. Default: "todo_"

in **mergeFiles.js** you can change the directory in which you want the merged file to be saved to.
Default: *++PROCESSED"* (it will create an additional folder called "merged")


