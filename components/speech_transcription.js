// define style rules to be programtically loaded
var style = document.createElement('style');
style.innerHTML = `

.speech-transcription-container{
    text-align:left;
    margin:30px;
}

.word{
    cursor: pointer;
}

.speech{
    padding: 5px 10px;
    margin: 5px;    
    border-radius: 5px;
}

.current_word{
    border-bottom: solid #DB4437 3px;
}

.current_speech{
    border: solid 2px #4285F4;
}
`;
document.getElementsByTagName('head')[0].appendChild(style);


// define component
Vue.component('speech-transcription-viz', {
    props: ['json_data', 'audio_info'],  // Changed from video_info to audio_info
    data: function () {
        return {
            interval_timer: null,
            current_time: 0,
            indexed_speech_cache: null,
        }
    },
    computed: {
        detected_speech: function () {
            `
            Extract just the speech transcriptions data from json
            `
            if (!this.json_data.annotation_results)
                return []

            for (let index = 0; index < this.json_data.annotation_results.length; index++) {
                if ('speech_transcriptions' in this.json_data.annotation_results[index])
                    return this.json_data.annotation_results[index].speech_transcriptions
            }
            return []
        },

        indexed_speech: function () {
    
            const indexed_speech = []

            if (this.detected_speech) {

                this.detected_speech.forEach(element => {
                    if(element.alternatives[0].transcript)
                    indexed_speech.push(new Detected_Speech(element, this.current_time))
                })
            }

            return indexed_speech
        },
    },
    methods: {
 
        word_clicked: function (word_data) {
            this.$emit('word-clicked', { seconds: word_data.start_time })
        },
    },
    template: `
    <div class="speech-transcription-container">

        <div class="data-warning" v-if="detected_speech.length == 0"> No speech data in JSON</div>

        <p class="speech" v-for="speech in indexed_speech" v-bind:class="{current_speech:speech.current_speech}"> 
            <span class="word" v-bind:class="{current_word:word.current_word}" v-for="word in speech.words" v-on:click="word_clicked(word)" > {{word.word}} </span>
        </p>

    </div>
    `,
    mounted: function () {
        console.log('mounted component');

        const component = this;

        const audio = document.querySelector('audio');
        
        this.interval_timer = setInterval(function () {
            component.current_time = audio.currentTime;
        }, 1000 / 5);
    },
    beforeDestroy: function () {
        console.log('destroying component');
        clearInterval(this.interval_timer);
    }
})

class Detected_Word {
    constructor(json_data, current_time) {
        this.word = json_data.word || '';
        this.start_time = nullable_time_offset_to_seconds(json_data.start_time);
        this.end_time = nullable_time_offset_to_seconds(json_data.end_time);
        this.current_word = this.within_time(current_time);
    }

    within_time(seconds) {
        return (this.start_time <= seconds) && (this.end_time >= seconds);
    }
}


class Detected_Speech {
    constructor(json_data, current_time) {
        const alternative = json_data.alternatives && json_data.alternatives[0] ? json_data.alternatives[0] : {};
        this.text = alternative.transcript || '';

        this.words = [];
        if (Array.isArray(alternative.words)) {
            alternative.words.forEach(word => {
                this.words.push(new Detected_Word(word, current_time));
            });
        }

        this.start_time = this.words.length > 0 ? this.words[0].start_time : 0;
        this.end_time = this.words.length > 0 ? this.words[this.words.length - 1].end_time : 0;

        this.current_speech = this.within_time(current_time);
    }

    within_time(seconds) {
        return (this.start_time <= seconds) && (this.end_time >= seconds);
    }
}