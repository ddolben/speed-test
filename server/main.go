package main

import (
  "flag"
  "fmt"
  "log"
  "math/rand"
  "net/http"
  "strconv"
  "time"
)

func serveTest(w http.ResponseWriter, r *http.Request) {
  fmt.Fprintf(w, "{}")
}

func generateRandomData(n int) string {
  kAlphabet := []rune("abcdefghijklmnopqrstuvwxyz0123456789")

  b := make([]rune, n)
  for i := range b {
      b[i] = kAlphabet[rand.Intn(len(kAlphabet))]
  }
  return string(b)
}

var dataCache map[int]string

func main() {
  fHost := flag.String("host", "0.0.0.0", "port to serve on")
  fPort := flag.Int("port", 8000, "port to serve on")
  fStaticFileDir := flag.String("static_root", "../dist/app", "port to serve on")
  flag.Parse()

  dataCache = make(map[int]string)
  rand.Seed(time.Now().UnixNano())
  //data := generateRandomData(1000000);
  //data := "hello world"

  http.HandleFunc("/api/test", func (w http.ResponseWriter, r *http.Request) {
    //log.Printf("serving test data")
    numBytes := 1000000
    sizeStr := r.URL.Query().Get("size")
    if len(sizeStr) > 0 {
      var err error
      numBytes, err = strconv.Atoi(sizeStr)
      if err != nil {
        panic(err)
      }
    }
    var data string
    if v, ok := dataCache[numBytes]; ok {
      data = v
    } else {
      data = generateRandomData(numBytes)
      dataCache[numBytes] = data
    }
    fmt.Fprintf(w, "%s", data)
  })
  http.Handle("/", http.FileServer(http.Dir(*fStaticFileDir)))

  host := fmt.Sprintf("%s:%d", *fHost, *fPort)
  log.Printf("serving on %s", host)
  log.Fatal(http.ListenAndServe(host, nil))
}

