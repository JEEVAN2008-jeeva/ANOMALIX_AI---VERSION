import os


from crewai import LLM
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import (
	FileReadTool
)






@CrewBase
class AnomalixAiCrew:
    """AnomalixAi crew"""

    
    @agent
    def log_collection_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["log_collection_specialist"],
            
            
            tools=[				FileReadTool()],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-6-luna",
                
                
            ),
            
        )
        
    
    @agent
    def anomaly_detection_analyst(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["anomaly_detection_analyst"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-6-luna",
                
                
            ),
            
        )
        
    
    @agent
    def threat_investigator(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["threat_investigator"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-6-luna",
                
                
            ),
            
        )
        
    
    @agent
    def risk_assessment_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["risk_assessment_specialist"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-6-luna",
                
                
            ),
            
        )
        
    
    @agent
    def security_report_writer(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["security_report_writer"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-6-luna",
                
                
            ),
            
        )
        
    

    
    @task
    def collect_and_validate_logs(self) -> Task:
        return Task(
            config=self.tasks_config["collect_and_validate_logs"],
            markdown=False,
            
            
        )
    
    @task
    def detect_anomalies(self) -> Task:
        return Task(
            config=self.tasks_config["detect_anomalies"],
            markdown=False,
            
            
        )
    
    @task
    def investigate_anomalies(self) -> Task:
        return Task(
            config=self.tasks_config["investigate_anomalies"],
            markdown=False,
            
            
        )
    
    @task
    def assess_risk(self) -> Task:
        return Task(
            config=self.tasks_config["assess_risk"],
            markdown=False,
            
            
        )
    
    @task
    def generate_security_report(self) -> Task:
        return Task(
            config=self.tasks_config["generate_security_report"],
            markdown=False,
            
            
        )
    

    @crew
    def crew(self) -> Crew:
        """Creates the AnomalixAi crew"""

        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,  # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,

            chat_llm=LLM(model="openai/gpt-6-luna"),
        )


