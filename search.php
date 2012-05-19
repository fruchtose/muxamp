<?php
if (!(isset($_GET['q']) && isset($_GET['s']))) {
    exit;
}

$query = urlencode($_GET['q']);
$source = urlencode($_GET['s']);

if (!is_string($query)) {
    echo json_encode(array("errors" => array("Search query must be a string.")));
}

if (!is_string($source)) {
    echo json_encode(array("errors" => array("Media source must be a string.")));
}

if (strlen($query) > 255) {
    echo json_encode(array("errors" => array("Input query is too long.")));
    exit;
}

// Courtesy of http://www.somacon.com/p537.php
function parallel_curl($urls) {
    // Create get requests for each URL
    $mh = curl_multi_init();
    foreach($urls as $i => $url)
    {
      $ch[$i] = curl_init($url);
      curl_setopt($ch[$i], CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($ch[$i], CURLOPT_SSL_VERIFYPEER, false);
      curl_multi_add_handle($mh, $ch[$i]);
    }

    // Start performing the request
    do {
        $execReturnValue = curl_multi_exec($mh, $runningHandles);
    } while ($execReturnValue == CURLM_CALL_MULTI_PERFORM);
    // Loop and continue processing the request
    while ($runningHandles && $execReturnValue == CURLM_OK) {
      // Wait forever for network
      $numberReady = curl_multi_select($mh);
      if ($numberReady != -1) {
        // Pull in any new data, or at least handle timeouts
        do {
          $execReturnValue = curl_multi_exec($mh, $runningHandles);
        } while ($execReturnValue == CURLM_CALL_MULTI_PERFORM);
      }
    }

    // Check for any errors
    if ($execReturnValue != CURLM_OK) {
      trigger_error("Curl multi read error $execReturnValue\n", E_USER_WARNING);
    }

    $res = array();
    // Extract the content
    foreach($urls as $i => $url)
    {
      // Check for errors
      $curlError = curl_error($ch[$i]);
      if($curlError == "") {
        $res[$i] = curl_multi_getcontent($ch[$i]);
      } else {
        print "Curl error on handle $i: $curlError\n";
      }
      // Remove and close the handle
      curl_multi_remove_handle($mh, $ch[$i]);
      curl_close($ch[$i]);
    }
    // Clean up the curl_multi handle
    curl_multi_close($mh);
    return $res;
}

class SearchResult {
    public $siteMediaID;
    public $siteCode;
    public $icon;
    public $permalink;
    public $url;
    public $artist;
    public $siteName;
    public $mediaName;
    public $duration;
    public $type;
    public $playRelevance;
    public $plays;
    public $favoriteRelevance;
    public $favorites;
    public $relevance;
    public $querySimilarity;
    
    public function __construct($siteName, $url, $permalink, $siteMediaID, $siteCode, $icon, $artist, $mediaName, $duration, $type, $plays, $favorites)
    {
        $this->siteName = $siteName;
        $this->url = $url;
        $this->permalink = $permalink;
        $this->siteMediaID = $siteMediaID;
        $this->siteCode = $siteCode;
        $this->icon = $icon;
        $this->artist = $artist;
        $this->mediaName = $mediaName;
        $this->duration = $duration;
        $this->type = $type;
        $this->plays = $plays;
        $this->favorites = $favorites;
    }
    
    public function calculateRelevance() {
        $lambda_plays = 0.70;
        $lambda_favorites = 0.30;
        $this->relevance = ($lambda_plays * $this->playRelevance + $lambda_favorites * $this->favoriteRelevance) * $this->querySimilarity;
    }
}

$results = array();

$soundcloud_key = "2f9bebd6bcd85fa5acb916b14aeef9a4";
$soundcloud_search_tracks_link = "http://api.soundcloud.com/tracks.json?client_id=$soundcloud_key&limit=25&offset=0&filter=streamable&order=hotness&q=$query";
$youtube_search_videos_link = "https://gdata.youtube.com/feeds/api/videos?v=2&format=5&max-results=25&orderby=relevance&alt=jsonc&q=$query";
$query_words = explode(" ", preg_replace('/[[:punct:]]/', ' ', strtolower($query)));
$query_word_count = count($query_words);
$max_query_similarity = 0;
$max_plays = 0;
$max_favorites = 0;

switch($source) {
    case 'sct':
        $soundcloud_track_results = array_slice(json_decode(file_get_contents($soundcloud_search_tracks_link)), 0, 25);
        for ($i = 0; $i < count($soundcloud_track_results); $i++) {
            $result = $soundcloud_track_results[$i];
            if (!isset($result->playback_count)) {
                $result->playback_count = -$i - 1;
                $result->favoritings_count = -$i - 1;
                continue;
            }
            if (!isset($result->stream_url)) {
                continue;
            }
            $new_result = new SearchResult("SoundCloud", $result->stream_url . "?client_id=$soundcloud_key", $result->permalink_url, $result->id, "sct", "img/soundcloud_orange_white_16.png", $result->user->username, $result->title, $result->duration / 1000, "audio", $result->playback_count, $result->favoritings_count);
            $comparison_string = preg_replace('/[[:punct:]]/', ' ', strtolower($new_result->artist . " " . $new_result->mediaName));
            $new_result->querySimilarity = (count(array_intersect($query_words, explode(" ", $comparison_string))))/$query_word_count;
            if ($new_result->plays > $max_plays) {
                $max_plays = $new_result->plays;
            }
            if ($new_result->favorites > $max_favorites) {
                $max_favorites = $new_result->favorites;
            }
            $results[] = $new_result;
        }
        break;
    case 'ytv':
        $youtube_video_results = json_decode(file_get_contents($youtube_search_videos_link));
        $youtube_video_results = $youtube_video_results->data;
        if ($youtube_video_results) {
            $youtube_video_results = $youtube_video_results->items;
        }
        for ($i = 0; $i < count($youtube_video_results); $i++) {
            $result = $youtube_video_results[$i];
            $permalink = "http://www.youtube.com/watch?v=" . $result->id;
            $new_result = new SearchResult("YouTube", $permalink, $permalink, $result->id, "ytv", "img/youtube.png", $result->uploader, $result->title, $result->duration, "video", $result->viewCount, $result->favoriteCount);
            $comparison_string = preg_replace('/[[:punct:]]/', ' ', strtolower($new_result->artist . " " . $new_result->mediaName));
            $new_result->querySimilarity = (count(array_intersect($query_words, explode(" ", $comparison_string))))/$query_word_count;
            if ($new_result->plays > $max_plays) {
                $max_plays = $new_result->plays;
            }
            if ($new_result->favorites > $max_favorites) {
                $max_favorites = $new_result->favorites;
            }
            $results[] = $new_result;
        }
        break;
    default:
        break;
}




if (count($results) > 0) {
    // Groups results by query similarity
    foreach ($results as &$result) {
        if ($result->plays < 0) {
            $new_plays = 0;
            $new_favorites = 0;
            for ($i = -1 * $result->plays; $i < count($results); $i++) {
                if ($results[$i]->plays >= 0) {
                    $new_plays = $results[$i]->plays;
                    $new_favorites = $results[$i]->favorites;
                    break;
                }
            }
            $result->plays = $new_plays;
            $result->favorites = $new_favorites;
        }
        $result->playRelevance = log($result->plays + 1) / log($max_plays + 1);
        $result->favoriteRelevance = log($result->favorites + 1) / log($max_favorites + 1);
        $result->calculateRelevance();
    }
    usort($results, function($a, $b) {
        if ($a->relevance == $b->relevance) {
            return 0;
        }
        return ($a->relevance > $b->relevance) ? -1 : 1;
    });
    foreach ($results as &$result) {
        unset($result->favoriteRelevance);
        unset($result->favorites);
        unset($result->playRelevance);
        unset($result->plays);
        unset($result->querySimilarity);
        unset($result->relevance);
    }
    // Sorts results by favorite count in descending order
    /*usort($results, function($a, $b) {
        if ($a->favorites == $b->favorites) {
            return 0;
        }
        return ($a->favorites < $b->favorites) ? 1 : -1;
    });

    $max_favorites = $results[0]->favorites;
    foreach ($results as &$result) {
        $result->favoriteRelevance = $result->favorites / $max_favorites;
    }
    
    // Sorts results by playback count in descending order
    usort($results, function($a, $b) {
        if ($a->plays == $b->plays) {
            return 0;
        }
        return ($a->plays < $b->plays) ? 1 : -1;
    });

    $max_plays = $results[0]->plays;
    foreach ($results as &$result) {
        $result->playRelevance = $result->plays / $max_plays;
    }
    
    foreach ($results as &$result) {
        $result->relevance = $result->calculate_relevance();
        $result->searchRelevance = ($max_query_similarity / $result->query_similarity);
    }
    
    // Sorts results by calculated relevance
    usort($results, function($a, $b) {
        $a_relevance = $a->relevance;
        $b_relebance = $b->relevance;
        if ($a_relevance == $b_relebance) {
            return 0;
        }
        return ($a_relevance < $b_relebance) ? 1 : -1;
    });*/
}

echo json_encode($results);

?>
