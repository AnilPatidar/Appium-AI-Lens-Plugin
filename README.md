# AI Appium Lens Plugin


## Overview

The AI Appium Lens Plugin is designed to enhance the capabilities of Appium by integrating AI-based image recognition and interaction features. This plugin leverages Google Cloud's Vision and Vertex AI services to provide advanced functionalities such as identifying elements on the screen and performing actions based on AI analysis.

![image](https://github.com/AnilPatidar/Appium-AI-Lens-Plugin/blob/main/AI-APPIUM-LENS.png)

## About Core Contributor

* Creator: Anil Patidar. [Linked in](https://in.linkedin.com/in/anilpatidar)

 [Follow me on LinkedIn](https://www.linkedin.com/comm/mynetwork/discovery-see-all?usecase=PEOPLE_FOLLOWS&followMember=anilpatidar)


## Why is this Plugin Needed?

Automated testing often requires interacting with elements on the screen that may not have easily identifiable locators. Traditional methods rely heavily on static locators, which can be brittle and fail when the UI changes. The AI Appium Lens Plugin addresses this issue by using AI to dynamically identify and interact with elements based on their visual characteristics, making your tests more robust and adaptable to UI changes.

Key Highlights of the Plugin

Answer natural language queries about the app's UI, describes App UI, colour of button, what type of icon on the app, what are the input fields , what type screen is displayed?
Provide detailed accessibility insights for visually impaired users.
Generate actionable outputs like clickable element coordinates and hierarchical structures.

## Features

- **AI-based Element Identification**: Use Google Cloud Vision to identify elements on the screen based on their visual characteristics.
- **Dynamic Interaction**: Perform actions on elements identified by AI, reducing dependency on static locators.
- **Session Management**: Persist session data and image URLs to maintain context across multiple interactions.
- **Screenshot Handling**: Automatically take and manage screenshots for AI analysis.

## Prerequisite

You must have a google cloud account with payment configured and a project created.
- ** Active/Enable two service under google cloud
* Google Vision AI 
* Google Vertex AI 

Download google cloud sdk ( google-cloud-cli-darwin-arm.tar.gz) : https://cloud.google.com/sdk/docs/install

Unzip and go to the path

```sh
export PATH=$PATH:<Actual-PATH>/google-cloud-sdk/bin
source ~/.zshrc
gcloud init
gcloud auth application-default login

```

## Installation

To install the AI Appium Lens Plugin, follow these steps:

appium plugin install --source=npm ai-appium-lens

Set enviornment variables :

```sh
export GOOGLE_PROJECT_ID=your-project-id
export GOOGLE_LOCATION=your-location
export GOOGLE_MODEL=your-model
```
Supported LLM Model

The following models support multimodal prompt responses.
* Gemini 1.5 Flash
* Gemini 1.5 Pro
* Gemini 1.0 Pro Vision
  
## Usage

## AI Click

The aiClick method allows you to perform a click action on an element identified by AI.

* First Register the command : 

 
        driver.addCommand(HttpMethod.POST,
                "/session/:sessionId/plugin/ai-appium-lens/aiClick",
                "aiClick");
                

```sh
          driver.execute("aiClick",
                ImmutableMap.of(
                        "text","Pick Team",
                        "index", 1, 
                        "takeANewScreenShot", true));
```

## Ask AI

* First Register the command : 

```sh
    driver.addCommand(HttpMethod.POST,
                "/session/:sessionId/plugin/ai-appium-lens/askAI",
                "askAI");
```

The askAI method allows you to send an instruction to the AI and get a response based on the current screen.

```sh

     Response result =  driver.execute("askAI",
               ImmutableMap.of("instruction",
               "What do you see on the UI?" ));
       System.out.println(result.getValue());
```


## Assert AI

* First Register the command :

  ```sh

    driver.addCommand(HttpMethod.POST,
                "/session/:sessionId/plugin/ai-appium-lens/aiAssert",
                "aiAssert");
  ```

The assertAI method allows you get the response in true/false for your statement.

```sh

      Response response=driver.execute("aiAssert",
                ImmutableMap.of("text","do you see continue button in red color"
                        ));
        Boolean result=Boolean.valueOf(response.getValue().toString());
        System.out.println(result);
```

## fetchUIElementsMetadataJson AI

* First Register the command : 

        driver.addCommand(HttpMethod.POST,
                "/session/:sessionId/plugin/ai-appium-lens/fetchUIElementsMetadataJson",
                "fetchUIElementsMetadataJson");

The fetchUIElementsMetadataJson method allows you to get complete UI meta info in json formate, 
Example : 

```json
[
  {
    "text": "No SIM",
    "color": "white",
    "position": "top left",
    "aligned": "not aligned",
    "above": null,
    "below": null,
    "icon": null,
    "icon_color": null,
    "icon_category": null
  },
  {
    "text": "1:13 AM",
    "color": "white",
    "position": "top right",
    "aligned": "not aligned",
    "above": null,
    "below": null,
    "icon": null,
    "icon_color": null,
    "icon_category": null
  }
]
```

```sh

   ObjectMapper objectMapper = new ObjectMapper();
        try {
            List<CustomJsonObject> jsonObjects = objectMapper.readValue(driver.execute("fetchUIElementsMetadataJson").getValue().toString().trim(), new TypeReference<List<CustomJsonObject>>() {});
        } catch (IOException e) {
            e.printStackTrace();
        }
```

Create this class since it is being used in above fetchUIElementsMetadataJson command.
```sh
@JsonIgnoreProperties(ignoreUnknown = true)
   static public class CustomJsonObject {
        private String text;
        private String color;
        private String position;
        private String aligned;
        private String above;
        private String below;
        private String icon;
        private String iconColor;
        private String iconCategory;

        // Getters and setters

        @JsonProperty("text")
        public String getText() {
            return text;
        }

        @JsonProperty("text")
        public void setText(String text) {
            this.text = text;
        }

        @JsonProperty("color")
        public String getColor() {
            return color;
        }

        @JsonProperty("color")
        public void setColor(String color) {
            this.color = color;
        }

        @JsonProperty("position")
        public String getPosition() {
            return position;
        }

        @JsonProperty("position")
        public void setPosition(String position) {
            this.position = position;
        }

        @JsonProperty("aligned")
        public String getAligned() {
            return aligned;
        }

        @JsonProperty("aligned")
        public void setAligned(String aligned) {
            this.aligned = aligned;
        }

        @JsonProperty("above")
        public String getAbove() {
            return above;
        }

        @JsonProperty("above")
        public void setAbove(String above) {
            this.above = above;
        }

        @JsonProperty("below")
        public String getBelow() {
            return below;
        }

        @JsonProperty("below")
        public void setBelow(String below) {
            this.below = below;
        }

        @JsonProperty("icon")
        public String getIcon() {
            return icon;
        }

        @JsonProperty("icon")
        public void setIcon(String icon) {
            this.icon = icon;
        }

        @JsonProperty("icon_color")
        public String getIconColor() {
            return iconColor;
        }

        @JsonProperty("icon_color")
        public void setIconColor(String iconColor) {
            this.iconColor = iconColor;
        }

        @JsonProperty("icon_category")
        public String getIconCategory() {
            return iconCategory;
        }

        @JsonProperty("icon_category")
        public void setIconCategory(String iconCategory) {
            this.iconCategory = iconCategory;
        }
    }

```

Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

License
This project is licensed under the MIT License.
