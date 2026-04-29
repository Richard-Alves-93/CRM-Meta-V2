const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, './frontend/src/components/Settings/Options.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Ensure Switch and FormControlLabel are imported
const hasSwitchImport = code.includes('@material-ui/core/Switch');
if (!hasSwitchImport) {
  code = code.replace(
    'import Select from "@material-ui/core/Select";',
    'import Select from "@material-ui/core/Select";\nimport Switch from "@material-ui/core/Switch";\nimport FormControlLabel from "@material-ui/core/FormControlLabel";'
  );
}

// 2. Identify the repeating pattern. 
const regex = /<FormControl className=\{classes\.selectContainer\}>[\s\S]*?<InputLabel id="([^"]+)">\s*([\s\S]*?)\s*<\/InputLabel>\s*<Select\s+labelId="[^"]+"\s+value=\{([^}]+)\}\s+onChange=\{async \(e\) => \{\s*([^;]+)\(e\.target\.value\);\s*\}\}\s*>[\s\S]*?<MenuItem value=\{"disabled"\}>[\s\S]*?<\/MenuItem>\s*<MenuItem value=\{"enabled"\}>[\s\S]*?<\/MenuItem>\s*<\/Select>\s*<FormHelperText>\s*\{.*(?:&&|\?|)\s*([\s\S]*?)\}\s*<\/FormHelperText>\s*<\/FormControl>/g;

code = code.replace(regex, (match, labelId, labelContent, stateVar, handler, helperText) => {
  return `<FormControl className={classes.selectContainer} margin="normal">
            <FormControlLabel
              control={
                <Switch
                  checked={${stateVar} === "enabled"}
                  onChange={async (e) => {
                    ${handler}(e.target.checked ? "enabled" : "disabled");
                  }}
                  color="primary"
                />
              }
              label={${labelContent}}
            />
            <FormHelperText>
              {${helperText}}
            </FormHelperText>
          </FormControl>`;
});

fs.writeFileSync(filePath, code);
console.log('Refactored Options.js successfully.');
