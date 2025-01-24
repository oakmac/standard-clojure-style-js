(ns hw1-test
  (:require
   [clojure.test :refer [deftest is run-tests]]
   [hw1 :refer :all]))

;;;; Group 1 Tests

(deftest atomic?-test
  (is (true? (atomic? 'a)))         ; Is chracter atomic
  (is (true? (atomic? 1)))          ; Is number atomic
  (is (false? (atomic? '(1 2 3))))  ; Is list atomic
  (is (false? (atomic? '[1 2 3])))  ; Is vector atomic
  (is (false? (atomic? '())))       ; Is empty list atomic
  (is (false? (atomic? '[])))       ; Is empty vector atomic
  (is (true? (atomic? nil))))       ; Is nil atomic

(deftest member?-test
  (is (true? (member? 'a '(b a c))))        ; Is chracter member
  (is (true? (member? 2 '(1 2 3))))         ; Is number member
  (is (false? (member? 4 '(1 2 3))))        ; Is not member
  (is (true? (member? '() '(1 () 3))))      ; Is empty list member
  (is (true? (member? nil '(1 nil 3))))     ; Is nil member
  (is (true? (member? '(1 2) '(1 (1 2)))))  ; Is non-empty list member
  (is (false? (member? 2 '(1 (1 (2) 3)))))) ; Is not member in multi-level list

(deftest my-count-test
  (is (= (my-count '(1 2 3)) 3))      ; Count elements in a list
  (is (= (my-count '()) 0))           ; Count elements in an empty list
  (is (= (my-count '[a b c]) 3))      ; Count elements in a vector
  (is (= (my-count '(1, (1, 2))) 2))  ; Count elements in multi-level list
  (is (= (my-count nil) 0)))          ; Count elements in nil

(deftest append-test
  (is (= (append '(1 2) '(3 4)) '(1 2 3 4)))  ; Append two lists
  (is (= (append '() '(3 4)) '(3 4)))         ; Append empty list to a list
  (is (= (append '(1 2) '()) '(1 2)))         ; Append a list to an empty list
  (is (= (append '() '()) '()))               ; Append two empty lists
  (is (= (append '(a b) '(c d)) '(a b c d)))) ; Append lists with characters

(deftest zip-test
  (is (= (zip '(1 2) '(a b)) '((1 a) (2 b))))   ; Zip two lists
  (is (= (zip '(1 2 3) '(a b)) '((1 a) (2 b)))) ; Zip lists with different lengths
  (is (= (zip '(nil) '(a)) '((nil a))))         ; Zip with nil
  (is (= (zip '() '(a b)) nil))                 ; Zip empty list with a list
  (is (= (zip '(1 2) '()) nil)))                ; Zip a list with an empty list

(deftest lookup-test
  (is (= (lookup 'a '((a 1) (b 2))) 1))         ; Lookup key
  (is (= (lookup 'b '((a 1) (b 2))) 2))         ; Lookup another key
  (is (= (lookup 'c '((a 1) (b 2))) nil))       ; Lookup missing key
  (is (= (lookup 'a '())) nil)                  ; Lookup in an empty list
  (is (= (lookup '(a b) '(((a b) 1) ((c) 2))))) ; Lookup list as key
  (is (= (lookup nil '((nil 1) (a 2))) 1))      ; Lookup nil as key
  (is (= (lookup 'a '((a 1) (a 2))) 1)))        ; Lookup with duplicate key

(deftest my-merge-test
  (is (= (my-merge '(1 3) '(2 4)) '(1 2 3 4)))      ; Merge two sorted lists
  (is (= (my-merge '(1 3 5) '(2 4)) '(1 2 3 4 5)))  ; Merge two sorted lists
  (is (= (my-merge '(1 2 3) '()) '(1 2 3)))         ; Merge a list with an empty list
  (is (= (my-merge '() '(4 5 6)) '(4 5 6)))         ; Merge an empty list with a list
  (is (= (my-merge '() '()) '()))                   ; Merge two empty lists
  (is (= (my-merge '(1 2 5) '(2 3)) '(1 2 2 3 5)))) ; Merge lists with overlap

(deftest count-all-test
  (is (= (count-all '(1 (2 3) 4)) 4))       ; Count in multi-level
  (is (= (count-all '()) 0))                ; Count in an empty list
  (is (= (count-all '(1 a (3 (b)))) 4))     ; Count mixed elements
  (is (= (count-all '[1]) 1))               ; Count in vector
  (is (= (count-all '(((1 2) (3 4)))) 4)))  ; Count in a double-nested list

(deftest my-drop-test
  (is (= (my-drop 2 '(1 2 3 4)) '(3 4)))      ; Drop first N elements
  (is (= (my-drop 4 '(1 2 3 4)) '()))         ; Drop all elements
  (is (= (my-drop 0 '(1 2 3 4)) '(1 2 3 4)))  ; Drop zero elements
  (is (= (my-drop 2 '()) '()))                ; Drop from an empty list
  (is (= (my-drop 5 '(1 2)) '())))            ; Drop more than the length

(deftest my-take-test
  (is (= (my-take 2 '(1 2 3 4)) '(1 2)))      ; Take first N elements
  (is (= (my-take 0 '(1 2 3 4)) nil))         ; Take zero elements
  (is (= (my-take 4 '(1 2 3 4)) '(1 2 3 4)))  ; Take all elements
  (is (= (my-take 5 '(1 2 3 4)) '(1 2 3 4)))  ; Take more than the length
  (is (= (my-take 2 '()) nil)))               ; Take from an empty list

(deftest my-reverse-test
  (is (= (my-reverse '(1 2 3)) '(3 2 1)))         ; Reverse a list
  (is (= (my-reverse '()) '()))                   ; Reverse an empty list
  (is (= (my-reverse '(1)) '(1)))                 ; Reverse a single-element list
  (is (= (my-reverse '(1 (2 3) 4)) '(4 (2 3) 1))) ; Reverse multi-level
  (is (= (my-reverse '(a b c)) '(c b a))))        ; Reverse a list of characters

(deftest remove-duplicates-test
  (is (= (remove-duplicates '(1 2 3 1 4 1 2)) '(1 2 3 4)))  ; Remove duplicates
  (is (= (remove-duplicates '()) '()))                      ; Remove from empty list
  (is (= (remove-duplicates '((1) 2 (1))) '((1) 2)))        ; Remove from multi-level list
  (is (= (remove-duplicates '(1 1 1)) '(1)))                ; Remove all duplicates
  (is (= (remove-duplicates '(a b c a)) '(a b c))))         ; Remove character duplicates

(deftest my-flatten-test
  (is (= (my-flatten '(1 (2 3) 4)) '(1 2 3 4))) ; Flatten a nested list
  (is (= (my-flatten '()) '()))                 ; Flatten an empty list
  (is (= (my-flatten '(() () (()))) '(())))     ; Flatten multi-level empty
  (is (= (my-flatten '(1 2 3)) '(1 2 3)))       ; Flatten a flat list
  (is (= (my-flatten '((1 2) (3))) '(1 2 3))))  ; Flatten a double-nested list

;;;; Group 2 Tests

(deftest buzz-test
  (is (= (buzz '(5 10 25 40)) '(:buzz :buzz :buzz :buzz)))  ; Transform multiples of 5 to buzz
  (is (= (buzz '(a b c)) '(a b c)))                         ; No transform for letters
  (is (= (buzz '(55 105 305)) '(:buzz :buzz :buzz)))        ; Buzz for numbers with a 5 digit
  (is (= (buzz '()) '()))                                   ; Buzz on empty list
  (is (= (buzz '(12 13 14)) '(12 13 14))))                  ; No buzz for no 5 or divisble by 5

(deftest divisors-of-test
  (is (= (divisors-of 10) '(2 5)))  ; Divisors of 10
  (is (= (divisors-of 11) '()))     ; Divisors of a prime number
  (is (= (divisors-of 1) '()))      ; Divisors of 1
  (is (= (divisors-of 0) '()))      ; Divisors of 0
  (is (= (divisors-of -2) '())))    ; Divisors of negative number

(deftest longest-test
  (is (= (longest '("a" "bcd" "ef")) "bcd"))  ; Longest string in list
  (is (= (longest '("abc")) "abc"))           ; Single string
  (is (= (longest '("")) ""))                 ; Empty string
  (is (= (longest '("a" "a")) "a"))           ; Same string
  (is (= (longest '("ab" "bc")) "bc")))       ; Same length

;;;; Group 3 Tests

(deftest my-map-test
  (is (= (my-map inc '(1 2 3)) '(2 3 4)))                 ; Map increment function
  (is (= (my-map inc '()) nil))                           ; Map increment function on empty list
  (is (= (my-map #(str % "!") '("a" "b")) '("a!" "b!")))  ; Map function to anonymous append "!"
  (is (= (my-map #(* % %) '(1 2 3 4)) '(1 4 9 16)))       ; Map square function
  (is (= (my-map divisors-of '(4 5 6)) '((2) () (2 3))))) ; Map divisors-of

(deftest my-filter-test
  (is (= (my-filter even? '(1 2 3 4)) '(2 4)))    ; Filter even
  (is (= (my-filter odd? '(1 2 3 4)) '(1 3)))     ; Filter odd
  (is (= (my-filter #(> % 2) '(1 2 3 4)) '(3 4))) ; Filter numbers greater than 2
  (is (= (my-filter #(= % 2) '(1 2 3 4)) '(2)))   ; Filter numbers equal to 2
  (is (= (my-filter identity '()) nil)))          ; Filter an empty list

(deftest my-reduce-test
  (is (= (my-reduce + 0 '(1 2 3 4)) 10))    ; Reduce sum
  (is (= (my-reduce * 1 '(1 2 3 4)) 24))    ; Reduce multiplication
  (is (= (my-reduce min nil '(4 2 8 6)) 2)) ; Reduce minimum
  (is (= (my-reduce max nil '(3 2 8 6)) 8)) ; Reduce maximum
  (is (= (my-reduce + nil '()) nil)))       ; Reduce on an empty list

(deftest my-flat-map-test
  (is (= (my-flat-map #(list % %) '(1 2 3)) '(1 1 2 2 3 3))) ; Flat map duplicating elements
  (is (= (my-flat-map #(list (* % 2)) '(1 2 3)) '(2 4 6))) ; Flat map with multiplication
  (is (= (my-flat-map #(list) '()) '()))
  (is (= (my-flat-map #(list % (* % %)) '(1 2 3)) '(1 1 2 4 3 9)))
  (is (= (my-flat-map #(repeat % %) '(1 2 3)) '(1 2 2 3 3 3))))

(run-tests)
