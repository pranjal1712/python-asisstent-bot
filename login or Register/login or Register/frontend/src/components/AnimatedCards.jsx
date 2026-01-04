import React, { useEffect, useRef } from "react";
import "./AnimatedCards.css";

const CARDS = [
    "Explain Python decorators with an example",
    "Help me debug my Python recursion code",
    "How do I connect Python to MongoDB?",
    "Explain Python’s GIL in simple terms",
    "Compare Python’s tuple vs list with use cases",
    "Show me how to use Pandas for data analysis",
    "Write a function to check if a number is prime",
    "How does list comprehension work in Python?",
    "Generate random passwords using Python",
    "Explain Python generators with yield",
    "Write a Flask app with a simple login page",
    "Write a Python script to scrape data from a website"
];

export default function AnimatedCards() {
    const refs = useRef([]);

    useEffect(() => {
        const els = refs.current.filter(Boolean);
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("play");
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    return (
        
            <div className="row g-4 justify-content-center">
                {CARDS.map((text, i) => (
                    <div key={i} className="col-12 col-sm-6 col-lg-4">
                        <div
                            ref={(el) => (refs.current[i] = el)}
                            className={`card-anim ${i % 2 ? "r" : "l"}`}
                            style={{ animationDelay: `${i * 120}ms` }}
                        >
                            <div className="inner-glass hover-anim">
                                <p className="m-3 fw-semibold text-center">{text}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
       
    );
}
