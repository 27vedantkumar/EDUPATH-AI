import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("edupath.ingestion.taxonomy")

class TaxonomyExtractor:
    """
    Extracts structured topics, concepts, summaries, and prerequisite dependency graphs
    from ingested knowledge units.
    """

    # Domain Knowledge Graph Blueprint for Computer Systems / Operating Systems
    DOMAIN_PREREQUISITES = {
        "Banker's Algorithm": ["Safe State", "Deadlock Avoidance"],
        "Deadlock Avoidance": ["Resource Allocation Graph", "Deadlock Conditions"],
        "Safe State": ["Resource Allocation Graph", "Deadlock Conditions"],
        "Resource Allocation Graph": ["Deadlock Conditions", "Process Lifecycle"],
        "Deadlock Prevention": ["Deadlock Conditions"],
        "Deadlock Conditions": ["Process Lifecycle", "Multithreading & Concurrency"],
        "Multithreading & Concurrency": ["Process Lifecycle"],
        "Context Switching": ["Process Control Block", "Process Lifecycle"],
        "Process Control Block": ["Process Lifecycle"],
        "Round Robin Scheduling": ["Scheduling Criteria", "Context Switching"],
        "Shortest Job First": ["Scheduling Criteria"],
        "First-Come First-Served": ["Scheduling Criteria"],
        "Scheduling Criteria": ["Process Lifecycle"],
        "Virtual Memory & Page Faults": ["Paging & Address Translation"],
        "Paging & Address Translation": ["Memory Allocation"],
        "Segmentation": ["Memory Allocation"],
    }

    CONCEPT_SUMMARIES = {
        "Deadlock Conditions": "Four Coffman conditions necessary for deadlock: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.",
        "Resource Allocation Graph": "Directed graph where vertices represent processes and resources, with request and assignment edges determining circular wait cycles.",
        "Deadlock Prevention": "Eliminates deadlocks by invalidating at least one of the four necessary Coffman conditions at system design time.",
        "Deadlock Avoidance": "Dynamic run-time decision making ensuring the system never enters an unsafe state that could lead to deadlocks.",
        "Safe State": "A state is safe if there exists a sequence of processes such that each process can satisfy its maximum resource requests using currently available and released resources.",
        "Banker's Algorithm": "Dijkstra's deadlock avoidance algorithm testing for safety by simulating the allocation of predetermined maximum possible amounts of all resources.",
        "Process Lifecycle": "The stages a program undergoes during execution: New, Ready, Running, Waiting, Terminated.",
        "Process Control Block": "Data structure containing OS information for process management (PID, registers, program counter, open files).",
        "Context Switching": "Storing the state of a CPU process so that it can be restored and execution resumed from the same point later.",
        "Multithreading & Concurrency": "Simultaneous execution of multiple lightweight subprocesses sharing common memory space and code segments.",
        "Scheduling Criteria": "Metrics used to compare CPU scheduling algorithms: CPU utilization, throughput, turnaround time, waiting time, and response time.",
        "First-Come First-Served": "Non-preemptive scheduling executing processes in the strict order of arrival in the ready queue.",
        "Shortest Job First": "Scheduling algorithm that selects the process with the smallest execution burst time.",
        "Round Robin Scheduling": "Preemptive algorithm designed for time-sharing systems where each process receives a fixed time slice (quantum).",
        "Memory Allocation": "Methods used by the operating system to distribute main memory among concurrent processes.",
        "Paging & Address Translation": "Memory management scheme dividing physical memory into fixed-size frames and virtual memory into pages mapped via a Page Table.",
        "Virtual Memory & Page Faults": "Technique allowing execution of processes not completely in physical memory, triggering a page fault interrupt on invalid page access.",
        "Segmentation": "Memory management scheme supporting user view of memory using variable-length segments (code, stack, data)."
    }

    @classmethod
    def extract_taxonomy(cls, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Derives topics, concepts, summaries, and directed prerequisite links
        from the ingested chunks.
        """
        topics_map: Dict[str, Dict[str, Any]] = {}
        concepts_map: Dict[str, Dict[str, Any]] = {}

        for ch in chunks:
            t_name = ch.get("topic", "Core Fundamentals")
            c_name = ch.get("concept", "General Concept")
            
            if t_name not in topics_map:
                topics_map[t_name] = {
                    "name": t_name,
                    "concepts": set(),
                    "chunk_count": 0
                }
            topics_map[t_name]["concepts"].add(c_name)
            topics_map[t_name]["chunk_count"] += 1

            if c_name not in concepts_map:
                summary = cls.CONCEPT_SUMMARIES.get(c_name, f"Core principles and mechanisms of {c_name}.")
                concepts_map[c_name] = {
                    "name": c_name,
                    "topic_name": t_name,
                    "summary": summary,
                    "difficulty_baseline": 0.5,
                    "prerequisites": cls.DOMAIN_PREREQUISITES.get(c_name, [])
                }

        # Convert sets to lists for JSON serialization
        topics_list = []
        for idx, (t_name, data) in enumerate(topics_map.items()):
            topics_list.append({
                "name": t_name,
                "order_index": idx + 1,
                "concepts": list(data["concepts"]),
                "chunk_count": data["chunk_count"]
            })

        return {
            "topics": topics_list,
            "concepts": list(concepts_map.values()),
            "prerequisites": [
                {"concept": c_name, "prerequisite": pr}
                for c_name, data in concepts_map.items()
                for pr in data["prerequisites"]
            ]
        }
