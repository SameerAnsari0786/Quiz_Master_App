package com.ansari.QuizApp.dao;

import com.ansari.QuizApp.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository

public interface QuestionDao extends JpaRepository<Question,Integer> {


    List<Question> findByCategoryIgnoreCase(String category);


    @Query(value = "SELECT * FROM question q WHERE LOWER(q.category) = LOWER(?1) ORDER BY RAND() LIMIT ?2", nativeQuery = true)
    List<Question> findRandomQuestionByCategory(String category, int numQ);


}
