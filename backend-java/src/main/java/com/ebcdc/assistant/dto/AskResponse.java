package com.ebcdc.assistant.dto;

public class AskResponse {

    private String question;
    private String answer;
    private Integer sourcesUsed;

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public Integer getSourcesUsed() {
        return sourcesUsed;
    }

    public void setSourcesUsed(Integer sourcesUsed) {
        this.sourcesUsed = sourcesUsed;
    }
}
